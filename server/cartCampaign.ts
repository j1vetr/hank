import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { productCategories, products, type AutoCartCampaign } from "@shared/schema";

type CartItemLike = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product?: {
    id: string;
    name: string;
    basePrice: string;
    categoryId?: string | null;
  } | null;
  variant?: {
    price: string;
  } | null;
};

export type CampaignLine = {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  eligible: boolean;
  discountedQuantity: number;
  discountedUnitPrice: number;
  discountAmount: number;
};

export type CartCampaignPricing = {
  subtotal: number;
  campaignDiscount: number;
  discountedSubtotal: number;
  campaign: {
    id: string;
    name: string;
    customerMessage: string | null;
    buyQuantity: number;
    rewardQuantity: number;
    discountPercentage: number;
  } | null;
  campaignDiscountDetails: {
    campaignName: string;
    discountedItems: Array<{ productId: string; quantity: number; discountAmount: string }>;
  } | null;
  eligibleItemCount: number;
  requiredItemCount: number;
  applications: number;
  remainingItems: number;
  progressMessage: string | null;
  lines: CampaignLine[];
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);

function campaignIsInDateRange(campaign: AutoCartCampaign, now = new Date()) {
  return (
    campaign.isActive &&
    (!campaign.startsAt || campaign.startsAt <= now) &&
    (!campaign.endsAt || campaign.endsAt >= now)
  );
}

async function getCategoryMap(productIds: string[]) {
  const categoryMap = new Map<string, Set<string>>();
  if (productIds.length === 0) return categoryMap;

  const productRows = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.isActive, true)));
  productRows.forEach(product => {
    const ids = new Set<string>();
    if (product.categoryId) ids.add(product.categoryId);
    categoryMap.set(product.id, ids);
  });

  const categoryRows = await db
    .select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(inArray(productCategories.productId, productIds));
  categoryRows.forEach(row => {
    if (!categoryMap.has(row.productId)) categoryMap.set(row.productId, new Set());
    categoryMap.get(row.productId)!.add(row.categoryId);
  });
  return categoryMap;
}

export async function getCampaignEligibleProductIds(campaign: AutoCartCampaign) {
  const rows = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(eq(products.isActive, true));
  const categoryMap = await getCategoryMap(rows.map(row => row.id));
  const includedCategories = new Set(campaign.includedCategoryIds || []);
  const includedProducts = new Set(campaign.includedProductIds || []);
  const excludedCategories = new Set(campaign.excludedCategoryIds || []);
  const excludedProducts = new Set(campaign.excludedProductIds || []);

  return rows
    .filter(product => {
      const categories = categoryMap.get(product.id) || new Set<string>();
      if (excludedProducts.has(product.id) || Array.from(categories).some(id => excludedCategories.has(id))) {
        return false;
      }
      if (campaign.scopeType === "products") return includedProducts.has(product.id);
      if (campaign.scopeType === "categories") {
        return Array.from(categories).some(id => includedCategories.has(id));
      }
      return true;
    })
    .map(product => product.id);
}

function isProductEligible(
  campaign: AutoCartCampaign,
  productId: string,
  categoryIds: Set<string>,
) {
  const excludedCategories = new Set(campaign.excludedCategoryIds || []);
  const excludedProducts = new Set(campaign.excludedProductIds || []);
  if (excludedProducts.has(productId) || Array.from(categoryIds).some(id => excludedCategories.has(id))) {
    return false;
  }
  if (campaign.scopeType === "products") {
    return (campaign.includedProductIds || []).includes(productId);
  }
  if (campaign.scopeType === "categories") {
    return Array.from(categoryIds).some(id => (campaign.includedCategoryIds || []).includes(id));
  }
  return true;
}

export async function calculateCartCampaign(
  cartItems: CartItemLike[],
  campaign?: AutoCartCampaign | null,
): Promise<CartCampaignPricing> {
  const productIds = Array.from(new Set(cartItems.map(item => item.productId)));
  const categoryMap = await getCategoryMap(productIds);
  const lines: CampaignLine[] = cartItems.map(item => {
    const product = item.product;
    const unitPrice = Number(item.variant?.price || product?.basePrice || 0);
    const eligible = Boolean(campaign && product) && isProductEligible(
      campaign!,
      item.productId,
      categoryMap.get(item.productId) || new Set(product?.categoryId ? [product.categoryId] : []),
    );
    return {
      cartItemId: item.id,
      productId: item.productId,
      productName: product?.name || "Ürün",
      quantity: item.quantity,
      unitPrice: money(unitPrice),
      lineSubtotal: money(unitPrice * item.quantity),
      eligible: Boolean(campaign) && eligible,
      discountedQuantity: 0,
      discountedUnitPrice: money(unitPrice),
      discountAmount: 0,
    };
  });

  const subtotal = money(lines.reduce((sum, line) => sum + line.lineSubtotal, 0));
  if (!campaign || !campaignIsInDateRange(campaign)) {
    return {
      subtotal,
      campaignDiscount: 0,
      discountedSubtotal: subtotal,
      campaign: null,
      campaignDiscountDetails: null,
      eligibleItemCount: 0,
      requiredItemCount: 0,
      applications: 0,
      remainingItems: 0,
      progressMessage: null,
      lines,
    };
  }

  const eligibleUnits = lines.flatMap((line, lineIndex) =>
    line.eligible
      ? Array.from({ length: line.quantity }, (_, unitIndex) => ({
          lineIndex,
          unitIndex,
          priceCents: cents(line.unitPrice),
        }))
      : [],
  );
  const groupSize = campaign.buyQuantity + campaign.rewardQuantity;
  const possibleApplications = Math.floor(eligibleUnits.length / groupSize);
  const applications = Math.min(
    possibleApplications,
    campaign.maxApplications || Number.MAX_SAFE_INTEGER,
  );
  const rewardUnitCount = applications * campaign.rewardQuantity;
  const rewardUnits = [...eligibleUnits]
    .sort((a, b) => a.priceCents - b.priceCents || a.lineIndex - b.lineIndex || a.unitIndex - b.unitIndex)
    .slice(0, rewardUnitCount);

  const discountByLine = new Map<number, { quantity: number; amount: number; discountedUnitPrice: number }>();
  rewardUnits.forEach(unit => {
    const discountCents = Math.round(unit.priceCents * (Number(campaign.discountPercentage) / 100));
    const amount = discountCents / 100;
    const current = discountByLine.get(unit.lineIndex) || {
      quantity: 0,
      amount: 0,
      discountedUnitPrice: (unit.priceCents - discountCents) / 100,
    };
    current.quantity += 1;
    current.amount = money(current.amount + amount);
    discountByLine.set(unit.lineIndex, current);
  });
  discountByLine.forEach((discount, lineIndex) => {
    lines[lineIndex].discountedQuantity = discount.quantity;
    lines[lineIndex].discountedUnitPrice = discount.discountedUnitPrice;
    lines[lineIndex].discountAmount = discount.amount;
  });

  const campaignDiscount = money(
    Array.from(discountByLine.values()).reduce((sum, discount) => sum + discount.amount, 0),
  );
  const discountedItems = lines
    .filter(line => line.discountAmount > 0)
    .map(line => ({
      productId: line.productId,
      quantity: line.discountedQuantity,
      discountAmount: line.discountAmount.toFixed(2),
    }));
  const remainingItems = Math.max(0, groupSize - (eligibleUnits.length % groupSize));
  let progressMessage = campaign.customerMessage || null;
  if (!progressMessage) {
    if (applications > 0) {
      progressMessage = `${campaign.name}: ${rewardUnitCount} ürün için %${Number(campaign.discountPercentage)} indirim uygulandı.`;
    } else if (eligibleUnits.length > 0) {
      const needed = Math.max(1, groupSize - eligibleUnits.length);
      progressMessage = `${needed} ürün daha ekleyin, avantajı kazanın.`;
    } else {
      progressMessage = "Bu kampanya için uygun ürün bulunmuyor.";
    }
  }

  return {
    subtotal,
    campaignDiscount,
    discountedSubtotal: money(Math.max(0, subtotal - campaignDiscount)),
    campaign: {
      id: campaign.id,
      name: campaign.name,
      customerMessage: campaign.customerMessage,
      buyQuantity: campaign.buyQuantity,
      rewardQuantity: campaign.rewardQuantity,
      discountPercentage: Number(campaign.discountPercentage),
    },
    campaignDiscountDetails: {
      campaignName: campaign.name,
      discountedItems,
    },
    eligibleItemCount: eligibleUnits.length,
    requiredItemCount: groupSize,
    applications,
    remainingItems: applications > 0 && remainingItems === groupSize ? 0 : remainingItems,
    progressMessage,
    lines,
  };
}
