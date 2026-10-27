/**
 * Run explicitly: npx tsx --test server/directCartDiscount.integration.ts
 * Uses inactive campaigns and temporary catalog/cart fixtures only.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { categories, productCategories } from "@shared/schema";
import { runAutoCartCampaignMigration } from "./runMigrations";
import { parseAutoCartCampaignPayload } from "./cartCampaignPayload";
import { calculateCartCampaign, getCampaignEligibleProductIds } from "./cartCampaign";
import { calculateCheckoutPricing } from "./orderPricing";

after(async () => { await db.$client.end(); });

test("direct campaign CRUD, migrations and category joins preserve persisted cart/checkout amounts and catalog prices", async () => {
  await runAutoCartCampaignMigration();
  const prefix = `DIRECT-TEST-${randomUUID()}`;
  const productIds: string[] = [];
  const categoryIds: string[] = [];
  let campaignId: string | undefined;
  const sessionId = `${prefix}-cart`;
  try {
    const [selected] = await db.insert(categories).values({ name: `${prefix}-selected`, slug: `${prefix}-selected` }).returning();
    categoryIds.push(selected.id);
    const [other] = await db.insert(categories).values({ name: `${prefix}-other`, slug: `${prefix}-other` }).returning();
    categoryIds.push(other.id);
    for (let index = 0; index < 3; index++) {
      const price = ["1000.00", "2000.00", "500.00"][index];
      const product = await storage.createProduct({
        name: `${prefix}-${index}`, slug: `${prefix}-${index}`, sku: `${prefix}-${index}`,
        basePrice: price, categoryId: index === 0 ? selected.id : other.id,
      });
      productIds.push(product.id);
      const variant = await storage.createProductVariant({
        productId: product.id, size: "M", price, stock: 10, sku: `${product.sku}-M`,
      });
      await storage.addToCart({ sessionId, productId: product.id, variantId: variant.id, quantity: index === 2 ? 2 : 1 });
    }
    await db.insert(productCategories).values({ productId: productIds[2], categoryId: selected.id });
    const saved = await storage.createAutoCartCampaign(parseAutoCartCampaignPayload({
      campaignType: "direct", discountType: "fixed", discountAmount: "200.00",
      scopeType: "categories", includedCategoryIds: [selected.id], isActive: false,
    }));
    campaignId = saved.id;
    assert.equal(saved.campaignType, "direct");
    assert.equal(saved.discountAmount, "200.00");
    const fetched = (await storage.getAutoCartCampaigns()).find(row => row.id === saved.id)!;
    assert.equal(fetched.discountType, "fixed");
    assert.equal(fetched.isActive, false, "the test must not activate a campaign for real visitors");
    const eligibleIds = await getCampaignEligibleProductIds(saved);
    assert.ok(eligibleIds.includes(productIds[0]));
    assert.ok(eligibleIds.includes(productIds[2]));
    assert.ok(!eligibleIds.includes(productIds[1]));
    const cart = await storage.getCartItems(sessionId);
    const pricing = await calculateCartCampaign(cart, { ...saved, isActive: true });
    assert.equal(pricing.subtotal, 4000);
    assert.equal(pricing.campaignDiscount, 200);
    assert.equal(pricing.lines.find(line => line.productId === productIds[1])?.discountAmount, 0);
    const checkout = calculateCheckoutPricing(pricing, {
      discountType: "percentage", discountValue: "10", maxDiscountAmount: null,
      appliesToShipping: false, freeShipping: false,
    });
    assert.equal(checkout.paymentAmount, 342000);
    await runAutoCartCampaignMigration();
    const afterMigration = (await storage.getAutoCartCampaigns()).find(row => row.id === saved.id)!;
    assert.equal(afterMigration.name, saved.name, "startup must not rename direct campaigns as 2+1");
    assert.equal(afterMigration.description, saved.description);
    const updated = await storage.updateAutoCartCampaign(saved.id, parseAutoCartCampaignPayload({
      campaignType: "direct", discountType: "percentage", discountPercentage: 20,
      scopeType: "all", isActive: false,
    }));
    assert.equal(updated?.discountType, "percentage");
    const percentPricing = await calculateCartCampaign(cart, { ...updated!, isActive: true });
    assert.equal(percentPricing.campaignDiscount, 800);
    assert.equal(percentPricing.requiredItemCount, 0);
    for (let index = 0; index < productIds.length; index++) {
      const id = productIds[index];
      const expected = ["1000.00", "2000.00", "500.00"][index];
      assert.equal((await storage.getProduct(id))?.basePrice, expected);
      for (const variant of await storage.getProductVariants(id)) {
        assert.equal(variant.price, expected);
        assert.equal(variant.stock, 10);
      }
    }
    await storage.deleteAutoCartCampaign(saved.id);
    campaignId = undefined;
    assert.ok(!(await storage.getAutoCartCampaigns()).some(row => row.id === saved.id));
  } finally {
    await storage.clearCart(sessionId);
    if (campaignId) await storage.deleteAutoCartCampaign(campaignId);
    for (const id of productIds) await storage.deleteProduct(id);
    for (const id of categoryIds) await db.delete(categories).where(eq(categories.id, id));
  }
});
