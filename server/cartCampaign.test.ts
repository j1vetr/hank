import assert from "node:assert/strict";
import test from "node:test";
import type { AutoCartCampaign } from "@shared/schema";
import {
  calculateCartCampaign,
  type CartItemLike,
  type CartCampaignPricing,
} from "./cartCampaign";
import {
  calculateCheckoutPricing,
  campaignFieldsFromPendingPayment,
  campaignFieldsFromPricing,
} from "./orderPricing";

const now = new Date("2026-08-26T12:00:00.000Z");

function campaign(overrides: Partial<AutoCartCampaign> = {}): AutoCartCampaign {
  return {
    id: "campaign-2-plus-1",
    name: "2+1 Protein Kampanyası",
    description: null,
    customerMessage: null,
    isActive: true,
    startsAt: null,
    endsAt: null,
    buyQuantity: 2,
    rewardQuantity: 1,
    discountPercentage: "100",
    scopeType: "all",
    includedCategoryIds: [],
    includedProductIds: [],
    excludedCategoryIds: [],
    excludedProductIds: [],
    maxApplications: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function cartItem(
  id: string,
  productId: string,
  quantity: number,
  basePrice: string,
  options: { categoryId?: string; variantPrice?: string } = {},
): CartItemLike {
  return {
    id,
    productId,
    quantity,
    variantId: options.variantPrice ? `${productId}-variant` : null,
    product: {
      id: productId,
      name: `${productId} ürünü`,
      basePrice,
      categoryId: options.categoryId ?? null,
    },
    variant: options.variantPrice ? { price: options.variantPrice } : null,
  };
}

function categories(entries: Array<[string, string[]]>) {
  return new Map(entries.map(([productId, categoryIds]) => [productId, new Set(categoryIds)]));
}

function basketTotal(pricing: ReturnType<typeof calculateCheckoutPricing>) {
  return pricing.basket.reduce((sum, [, priceCents, quantity]) => (
    sum + Number(priceCents) * quantity
  ), 0);
}

test("2+1 kampanyası tekrar eden gruplarda en ucuz iki birimi indirir", async () => {
  const pricing = await calculateCartCampaign(
    [
      cartItem("premium", "premium", 2, "120.00"),
      cartItem("standard", "standard", 4, "80.00"),
    ],
    campaign(),
    categories([
      ["premium", ["protein"]],
      ["standard", ["protein"]],
    ]),
  );

  assert.equal(pricing.subtotal, 560);
  assert.equal(pricing.applications, 2);
  assert.equal(pricing.campaignDiscount, 160);
  assert.equal(pricing.discountedSubtotal, 400);
  assert.equal(pricing.remainingItems, 0);
  assert.equal(pricing.lines.find(line => line.productId === "standard")?.discountedQuantity, 2);
  assert.deepEqual(pricing.campaignDiscountDetails?.discountedItems, [
    { productId: "standard", quantity: 2, discountAmount: "160.00" },
  ]);
});

test("ürün ve kategori istisnaları dahil etme kapsamından önce uygulanır", async () => {
  const pricing = await calculateCartCampaign(
    [
      cartItem("allowed", "allowed", 1, "100.00", { categoryId: "protein" }),
      cartItem("category-excluded", "category-excluded", 1, "100.00", { categoryId: "protein" }),
      cartItem("product-excluded", "product-excluded", 1, "100.00", { categoryId: "protein" }),
    ],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      excludedCategoryIds: ["restricted"],
      excludedProductIds: ["product-excluded"],
    }),
    categories([
      ["allowed", ["protein"]],
      ["category-excluded", ["protein", "restricted"]],
      ["product-excluded", ["protein"]],
    ]),
  );

  assert.deepEqual(
    pricing.lines.map(line => [line.productId, line.eligible]),
    [
      ["allowed", true],
      ["category-excluded", false],
      ["product-excluded", false],
    ],
  );
  assert.equal(pricing.eligibleItemCount, 3);
  assert.equal(pricing.campaignDiscount, 100);
});

test("herhangi iki ürün seçili kategorideki üçüncü ürüne yüzde 50 indirim kazandırır", async () => {
  const pricing = await calculateCartCampaign(
    [
      cartItem("qualifier", "qualifier", 2, "60.00", { categoryId: "tshirt" }),
      cartItem("reward", "reward", 1, "200.00", { categoryId: "protein" }),
    ],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      discountPercentage: "50",
    }),
    categories([
      ["qualifier", ["tshirt"]],
      ["reward", ["protein"]],
    ]),
  );

  assert.equal(pricing.applications, 1);
  assert.equal(pricing.campaignDiscount, 100);
  assert.equal(pricing.lines.find(line => line.productId === "qualifier")?.discountedQuantity, 0);
  assert.equal(pricing.lines.find(line => line.productId === "reward")?.discountedQuantity, 1);
});

test("seçili kategorideki aynı üründen üç adet alındığında bir adet indirim alır", async () => {
  const pricing = await calculateCartCampaign(
    [cartItem("reward", "reward", 3, "200.00", { categoryId: "protein" })],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      discountPercentage: "50",
    }),
    categories([["reward", ["protein"]]]),
  );

  assert.equal(pricing.applications, 1);
  assert.equal(pricing.campaignDiscount, 100);
  assert.equal(pricing.lines[0].discountedQuantity, 1);
  assert.equal(pricing.lines[0].discountedUnitPrice, 100);
});

test("seçili kapsam dışında kalan üç ürün kampanya indirimi oluşturmaz", async () => {
  const pricing = await calculateCartCampaign(
    [cartItem("outside", "outside", 3, "90.00", { categoryId: "tshirt" })],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      discountPercentage: "50",
    }),
    categories([["outside", ["tshirt"]]]),
  );

  assert.equal(pricing.applications, 0);
  assert.equal(pricing.campaignDiscount, 0);
  assert.equal(pricing.remainingItems, 1);
  assert.match(pricing.progressMessage || "", /1 kampanya ürünü/);
});

test("iki kapsam dışı ürün sonrası kampanya ürünü eklemeye yönlendirir", async () => {
  const pricing = await calculateCartCampaign(
    [cartItem("winter", "winter", 2, "90.00", { categoryId: "winter" })],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      discountPercentage: "50",
    }),
    categories([["winter", ["winter"]]]),
  );

  assert.equal(pricing.applications, 0);
  assert.equal(pricing.remainingItems, 1);
  assert.equal(
    pricing.progressMessage,
    "1 kampanya ürünü daha ekleyin, %50 indirim kazanın.",
  );
});

test("tekrarlı uygulama ödül ürünü adediyle sınırlanır", async () => {
  const pricing = await calculateCartCampaign(
    [
      cartItem("qualifier", "qualifier", 5, "50.00", { categoryId: "tshirt" }),
      cartItem("reward", "reward", 1, "120.00", { categoryId: "protein" }),
    ],
    campaign({
      scopeType: "categories",
      includedCategoryIds: ["protein"],
      discountPercentage: "50",
    }),
    categories([
      ["qualifier", ["tshirt"]],
      ["reward", ["protein"]],
    ]),
  );

  assert.equal(pricing.applications, 1);
  assert.equal(pricing.campaignDiscount, 60);
  assert.equal(pricing.remainingItems, 1);
  assert.equal(pricing.lines.find(line => line.productId === "reward")?.discountedQuantity, 1);
});

test("varyant fiyatı ve maksimum uygulama limiti kullanılır", async () => {
  const pricing = await calculateCartCampaign(
    [cartItem("variant", "variant-product", 4, "150.00", { variantPrice: "79.99" })],
    campaign({
      buyQuantity: 1,
      rewardQuantity: 1,
      discountPercentage: "50",
      maxApplications: 1,
    }),
    categories([["variant-product", ["protein"]]]),
  );

  assert.equal(pricing.subtotal, 319.96);
  assert.equal(pricing.applications, 1);
  assert.equal(pricing.campaignDiscount, 40);
  assert.equal(pricing.discountedSubtotal, 279.96);
  assert.equal(pricing.lines[0].discountedQuantity, 1);
  assert.equal(pricing.lines[0].discountedUnitPrice, 39.99);
});

test("kupon indirimi kampanyadan sonraki toplam üzerinden PayTR sepetine uygulanır", async () => {
  const campaignPricing = await calculateCartCampaign(
    [cartItem("protein", "protein", 3, "400.00")],
    campaign(),
    categories([["protein", ["protein"]]]),
  );

  const checkoutPricing = calculateCheckoutPricing(campaignPricing, {
    discountType: "percentage",
    discountValue: "25",
    maxDiscountAmount: null,
    freeShipping: false,
    appliesToShipping: false,
  });

  assert.equal(campaignPricing.discountedSubtotal, 800);
  assert.equal(checkoutPricing.shippingCost, 200);
  assert.equal(checkoutPricing.discountAmount, 200);
  assert.equal(checkoutPricing.total, 800);
  assert.equal(basketTotal(checkoutPricing), 80000);
});

test("PayTR kaydı ve callback siparişi kampanya bilgisini aynı şekilde taşır", () => {
  const pricing: Pick<CartCampaignPricing, "campaign" | "campaignDiscount" | "campaignDiscountDetails"> = {
    campaign: {
      id: "campaign-2-plus-1",
      name: "2+1 Protein Kampanyası",
      customerMessage: null,
      buyQuantity: 2,
      rewardQuantity: 1,
      discountPercentage: 100,
    },
    campaignDiscount: 80,
    campaignDiscountDetails: {
      campaignName: "2+1 Protein Kampanyası",
      discountedItems: [{ productId: "protein", quantity: 1, discountAmount: "80.00" }],
    },
  };

  const pendingFields = campaignFieldsFromPricing(pricing);
  const orderFields = campaignFieldsFromPendingPayment(pendingFields);

  assert.deepEqual(pendingFields, {
    campaignId: "campaign-2-plus-1",
    campaignDiscountAmount: "80.00",
    campaignDiscountDetails: {
      campaignName: "2+1 Protein Kampanyası",
      discountedItems: [{ productId: "protein", quantity: 1, discountAmount: "80.00" }],
    },
  });
  assert.deepEqual(orderFields, pendingFields);
});