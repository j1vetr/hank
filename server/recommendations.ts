import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { productCategories, productVariants, products, type AutoCartCampaign, type Product } from "@shared/schema";
import { getCampaignEligibleProductIds } from "./cartCampaign";

export const FREE_SHIPPING_THRESHOLD = 2500;

export type RecommendationSource = "complementary" | "campaign" | "free_shipping";

export type RecommendationCard = {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
  availableSizes: string[];
  availableColors: Array<{ name: string; hex: string }>;
  stock: number;
  isOutOfStock: boolean;
  requiresVariant: boolean;
  defaultVariantId: string | null;
  defaultVariantLabel: string | null;
  source: RecommendationSource;
};

export type CartRecommendations = {
  sections: {
    complementary: RecommendationCard[];
    campaign: RecommendationCard[];
    freeShipping: RecommendationCard[];
  };
  freeShipping: {
    threshold: number;
    remaining: number;
  };
};

type CartRecommendationInput = {
  productId: string;
};

function productCategoriesFor(product: Product, categoryMap: Map<string, Set<string>>) {
  const categories = categoryMap.get(product.id) || new Set<string>();
  if (product.categoryId) categories.add(product.categoryId);
  return categories;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function toCard(product: Product, variants: Array<typeof productVariants.$inferSelect>, source: RecommendationSource): RecommendationCard {
  const activeVariants = variants.filter(variant => variant.isActive);
  const inStockVariant = activeVariants.find(variant => variant.stock > 0) || null;
  const hasVariants = variants.length > 0;
  const stock = hasVariants
    ? activeVariants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)
    : 1;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    images: product.images || [],
    availableSizes: product.availableSizes || [],
    availableColors: product.availableColors || [],
    stock,
    isOutOfStock: hasVariants && stock === 0,
    requiresVariant: hasVariants,
    defaultVariantId: inStockVariant?.id || null,
    defaultVariantLabel: inStockVariant
      ? [inStockVariant.size, inStockVariant.color].filter(Boolean).join(" / ") || null
      : null,
    source,
  };
}

export async function getCartRecommendations(
  cartItems: CartRecommendationInput[],
  pricing: {
    subtotal: number;
    eligibleItemCount: number;
    requiredItemCount: number;
  },
  campaign?: AutoCartCampaign | null,
): Promise<CartRecommendations> {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));
  const productIds = allProducts.map(product => product.id);
  const variants = productIds.length > 0
    ? await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
    : [];
  const variantsByProduct = new Map<string, Array<typeof productVariants.$inferSelect>>();
  variants.forEach(variant => {
    const current = variantsByProduct.get(variant.productId) || [];
    current.push(variant);
    variantsByProduct.set(variant.productId, current);
  });

  const categoryRows = productIds.length > 0
    ? await db.select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      }).from(productCategories).where(inArray(productCategories.productId, productIds))
    : [];
  const categoryMap = new Map<string, Set<string>>();
  categoryRows.forEach(row => {
    const current = categoryMap.get(row.productId) || new Set<string>();
    current.add(row.categoryId);
    categoryMap.set(row.productId, current);
  });

  const byId = new Map(allProducts.map(product => [product.id, product]));
  const cartProductIds = new Set(cartItems.map(item => item.productId));
  const usedIds = new Set(cartProductIds);
  const addCandidates = (ids: string[], source: RecommendationSource, limit: number, inStockOnly = false) => {
    const cards: RecommendationCard[] = [];
    for (const id of ids) {
      if (cards.length >= limit || usedIds.has(id)) continue;
      const product = byId.get(id);
      if (!product) continue;
      const card = toCard(product, variantsByProduct.get(id) || [], source);
      if (inStockOnly && card.isOutOfStock) continue;
      usedIds.add(id);
      cards.push(card);
    }
    return cards;
  };

  const cartProducts = cartItems.map(item => byId.get(item.productId)).filter(Boolean) as Product[];
  const relatedIds = cartProducts.flatMap(product => product.relatedProductIds || []);
  const cartCategories = new Set(cartProducts.flatMap(product => Array.from(productCategoriesFor(product, categoryMap))));
  const sameCategoryIds = allProducts
    .filter(product => Array.from(productCategoriesFor(product, categoryMap)).some(id => cartCategories.has(id)))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.getTime() - a.createdAt.getTime())
    .map(product => product.id);
  const complementaryCandidateIds = shuffle([
    ...relatedIds,
    ...sameCategoryIds,
    ...allProducts.filter(product => product.isFeatured).map(product => product.id),
  ]);
  const complementary = addCandidates(
    complementaryCandidateIds,
    "complementary",
    3,
    true,
  );

  const groupSize = campaign ? campaign.buyQuantity + campaign.rewardQuantity : 0;
  const remainder = groupSize > 0 ? pricing.eligibleItemCount % groupSize : 0;
  const neededForCampaign = campaign && pricing.requiredItemCount > 0
    ? remainder === 0 ? (pricing.eligibleItemCount === 0 ? groupSize : 0) : groupSize - remainder
    : 0;
  const eligibleIds = campaign && neededForCampaign > 0
    ? await getCampaignEligibleProductIds(campaign)
    : [];
  const campaignRecommendations = addCandidates(eligibleIds, "campaign", 3);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - pricing.subtotal);
  const shippingCandidates = remaining > 0
    ? [...allProducts]
      .filter(product => !usedIds.has(product.id))
      .sort((a, b) => {
        const aPrice = Number(a.basePrice);
        const bPrice = Number(b.basePrice);
        const aReaches = aPrice >= remaining ? 0 : 1;
        const bReaches = bPrice >= remaining ? 0 : 1;
        return aReaches - bReaches || Math.abs(aPrice - remaining) - Math.abs(bPrice - remaining);
      })
      .map(product => product.id)
    : [];
  const freeShipping = addCandidates(shippingCandidates, "free_shipping", 3);

  return {
    sections: {
      complementary,
      campaign: campaignRecommendations,
      freeShipping,
    },
    freeShipping: {
      threshold: FREE_SHIPPING_THRESHOLD,
      remaining,
    },
  };
}