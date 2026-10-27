import assert from "node:assert/strict";
import test from "node:test";
import type { AutoCartCampaign, Order, OrderItem } from "@shared/schema";
import { buildBizimHesapInvoice } from "./bizimhesapInvoice";
import { calculateCartCampaign, type CartItemLike } from "./cartCampaign";
import { calculateCheckoutPricing, campaignFieldsFromPricing } from "./orderPricing";
import { parseAutoCartCampaignPayload } from "./cartCampaignPayload";
import { getCampaignPresentation } from "@shared/campaignDisplay";

const campaign = (overrides: Partial<AutoCartCampaign> = {}): AutoCartCampaign => ({
  id: "direct-test", name: "Ignored custom title", description: null, customerMessage: null,
  campaignType: "direct", discountType: "percentage", discountAmount: "0.00",
  buyQuantity: 1, rewardQuantity: 1, discountPercentage: "20",
  isActive: true, startsAt: null, endsAt: null, maxApplications: null,
  scopeType: "all", includedCategoryIds: [], includedProductIds: [],
  excludedCategoryIds: [], excludedProductIds: [],
  createdAt: new Date(), updatedAt: new Date(), ...overrides,
});
const item = (id: string, price: string, quantity = 1, categoryId = "winter"): CartItemLike => ({
  id, productId: id, variantId: `${id}-M`, quantity,
  product: { id, name: `Test ${id}`, basePrice: price, categoryId },
  variant: { price },
});
const categories = new Map<string, Set<string>>();
const basketCents = (basket: [string, string, number][]) =>
  basket.reduce((sum, row) => sum + Number(row[1]) * row[2], 0);

test("direct percentage applies to one item without quantity conditions and keeps catalog prices unchanged", async () => {
  const cart = [item("one", "1000.00")];
  const before = JSON.stringify(cart);
  const result = await calculateCartCampaign(cart, campaign(), categories);
  assert.equal(result.campaignDiscount, 200);
  assert.equal(result.discountedSubtotal, 800);
  assert.equal(result.requiredItemCount, 0);
  assert.equal(result.remainingItems, 0);
  assert.equal(result.campaign?.campaignType, "direct");
  assert.match(result.campaign!.name, /%20/);
  assert.equal(JSON.stringify(cart), before);
});

test("category-scoped direct discounts include joined categories and exclude unrelated products and exceptions", async () => {
  const cart = [item("first", "100", 2), item("joined", "200"), item("other", "900", 1, "summer"), item("excluded", "100")];
  const map = new Map([
    ["first", new Set(["winter"])], ["joined", new Set(["summer", "winter"])],
    ["other", new Set(["summer"])], ["excluded", new Set(["winter"])],
  ]);
  const result = await calculateCartCampaign(cart, campaign({
    scopeType: "categories", includedCategoryIds: ["winter"], excludedProductIds: ["excluded"],
  }), map);
  assert.equal(result.campaignDiscount, 80);
  assert.deepEqual(result.lines.map(row => row.discountAmount), [40, 40, 0, 0]);
  assert.ok(result.campaignDiscountDetails!.discountedItems.every(row => row.variantId?.endsWith("-M")));
  const excludedCategory = await calculateCartCampaign(cart, campaign({
    scopeType: "categories", includedCategoryIds: ["winter"], excludedCategoryIds: ["winter"],
  }), map);
  assert.equal(excludedCategory.campaignDiscount, 0);
});

test("fixed TL applies once per eligible cart rather than once per item and respects the scope cap", async () => {
  const fixed = campaign({
    discountType: "fixed", discountAmount: "150.00", discountPercentage: "0",
    scopeType: "products", includedProductIds: ["eligible"],
  });
  const result = await calculateCartCampaign([item("eligible", "100", 3), item("other", "400")], fixed, categories);
  assert.equal(result.campaignDiscount, 150);
  assert.equal(result.discountedSubtotal, 550);
  assert.deepEqual(result.lines.map(row => row.discountAmount), [150, 0]);
  assert.match(result.campaign!.name, /150 TL/);
  assert.equal(result.applications, 1);
  const capped = await calculateCartCampaign([item("eligible", "100"), item("other", "400")], fixed, categories);
  assert.equal(capped.campaignDiscount, 100);
  assert.equal(capped.discountedSubtotal, 400);
  assert.equal(capped.lines[1].discountAmount, 0);
});

test("fixed discounts allocate exact cents across lines and units so PayTR always reconciles", async () => {
  const fixed = campaign({ discountType: "fixed", discountAmount: "0.01" });
  const result = await calculateCartCampaign([item("three", "0.01", 3)], fixed, categories);
  assert.equal(result.discountedSubtotal, 0.02);
  const checkout = calculateCheckoutPricing(result);
  assert.equal(checkout.paymentAmount, 20002);
  assert.equal(basketCents(checkout.basket), checkout.paymentAmount);
  const multiple = await calculateCartCampaign([
    item("a", "1.00", 3), item("b", "1.00", 3), item("c", "1.00", 3),
  ], fixed, categories);
  assert.deepEqual(multiple.lines.map(row => row.discountAmount), [0.01, 0, 0]);
  assert.equal(basketCents(calculateCheckoutPricing(multiple).basket), 20899);
});

test("coupons are applied after direct discount and campaign snapshots retain the exact variants", async () => {
  const result = await calculateCartCampaign([item("one", "1000.00", 3)], campaign(), categories);
  const checkout = calculateCheckoutPricing(result, {
    discountType: "percentage", discountValue: "10", maxDiscountAmount: null,
    freeShipping: false, appliesToShipping: false,
  });
  assert.equal(result.discountedSubtotal, 2400);
  assert.equal(checkout.paymentAmount, 216000);
  assert.equal(basketCents(checkout.basket), 216000);
  const snapshot = campaignFieldsFromPricing(result);
  assert.equal(snapshot.campaignId, "direct-test");
  assert.equal(snapshot.campaignDiscountAmount, "600.00");
  assert.deepEqual(snapshot.campaignDiscountDetails?.discountedItems, [{
    productId: "one", variantId: "one-M", quantity: 3, discountAmount: "600.00",
  }]);
});

test("date limits, inactive campaigns, empty carts and no eligible products never create a discount", async () => {
  for (const disabled of [
    campaign({ isActive: false }), campaign({ startsAt: new Date("2100-01-01") }),
    campaign({ endsAt: new Date("2000-01-01") }),
  ]) {
    assert.equal((await calculateCartCampaign([item("a", "100")], disabled, categories)).campaignDiscount, 0);
  }
  assert.equal((await calculateCartCampaign([], campaign(), categories)).campaignDiscount, 0);
  const none = await calculateCartCampaign([item("other", "100")], campaign({
    scopeType: "products", includedProductIds: ["selected"],
  }), categories);
  assert.equal(none.campaignDiscount, 0);
  assert.match(none.progressMessage!, /kampanyaya dahil/);
});

test("direct request validation normalizes irrelevant quantity fields and rejects invalid discounts and scopes", () => {
  const valid = parseAutoCartCampaignPayload({
    campaignType: "direct", discountType: "fixed", discountAmount: "125.50",
    buyQuantity: 99, rewardQuantity: 99, maxApplications: 99, name: "Untrusted title",
    scopeType: "all", isActive: true,
  });
  assert.equal(valid.buyQuantity, 1);
  assert.equal(valid.rewardQuantity, 1);
  assert.equal(valid.maxApplications, null);
  assert.equal(valid.discountAmount, "125.50");
  assert.match(valid.name, /125,5 TL/);
  const base = { campaignType: "direct", discountType: "percentage", discountPercentage: 20 };
  for (const invalid of [
    { discountPercentage: 101 }, { discountPercentage: 0 }, { discountPercentage: -1 },
    { discountPercentage: Infinity }, { discountType: "unknown" }, { campaignType: "unknown" },
    { discountPercentage: 0.0001 },
    { discountType: "fixed", discountAmount: 0 }, { discountType: "fixed", discountAmount: -1 },
    { discountType: "fixed", discountAmount: 100000000 }, { scopeType: "categories" },
    { scopeType: "products" }, { scopeType: "unknown" },
    { startsAt: "2026-12-31", endsAt: "2026-01-01" }, { startsAt: "not-a-date" },
  ]) {
    assert.throws(() => parseAutoCartCampaignPayload({ ...base, ...invalid }));
  }
  assert.equal(parseAutoCartCampaignPayload({ ...base, scopeType: "categories", includedCategoryIds: ["winter"] }).scopeType, "categories");
  assert.equal(parseAutoCartCampaignPayload({ discountPercentage: 50 }).campaignType, "quantity");
  assert.match(getCampaignPresentation({ campaignType: "direct", discountType: "percentage", discountPercentage: 20 }).name, /%20/);
});

test("direct fixed discounts, coupons and shipping reconcile with the invoice without changing unrelated product campaign amounts", async () => {
  const cart = [item("a", "3.33", 2), item("b", "12.34", 3), item("outside", "1000.00")];
  for (const amount of ["0.01", "12.55", "9000.00"]) {
    const pricing = await calculateCartCampaign(cart, campaign({
      discountType: "fixed", discountAmount: amount, scopeType: "products", includedProductIds: ["a", "b"],
    }), categories);
    assert.equal(pricing.lines[2].discountAmount, 0);
    const checkout = calculateCheckoutPricing(pricing, {
      discountType: "percentage", discountValue: "10", maxDiscountAmount: null,
      appliesToShipping: false, freeShipping: false,
    });
    const invoiceOrder = {
      id: "direct-invoice", orderNumber: "DIRECT-TEST", customerName: "Test",
      customerEmail: "test@example.invalid", customerPhone: "",
      shippingAddress: { address: "Test", city: "Test", district: "Test", postalCode: "00000" },
      subtotal: pricing.subtotal.toFixed(2), shippingCost: checkout.shippingCost.toFixed(2),
      discountAmount: checkout.discountAmount.toFixed(2), total: checkout.total.toFixed(2),
      ...campaignFieldsFromPricing(pricing),
    } as Order;
    const invoiceItems = pricing.lines.map(line => ({
      id: line.cartItemId, orderId: "direct-invoice", productId: line.productId, variantId: line.variantId,
      productName: line.productName, variantDetails: "M", quantity: line.quantity,
      price: line.unitPrice.toFixed(2), subtotal: line.lineSubtotal.toFixed(2),
    })) as OrderItem[];
    const invoice = buildBizimHesapInvoice(invoiceOrder, invoiceItems);
    assert.equal(Math.round(Number(invoice.amounts.total) * 100), checkout.paymentAmount);
    assert.equal(basketCents(checkout.basket), checkout.paymentAmount);
    assert.equal(
      Math.round(invoice.details.reduce((sum, row) => sum + Number(row.total), 0) * 100),
      checkout.paymentAmount,
    );
  }
});
