/**
 * Explicit database regression test: npx tsx --test server/productPrice.integration.ts
 * Creates isolated temporary products/cart, then removes only those fixtures.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { productVariants } from "../shared/schema";
import { calculateCartCampaign } from "./cartCampaign";
import { calculateCheckoutPricing } from "./orderPricing";

after(async () => { await db.$client.end(); });

test("bulk price updates synchronize every variant, existing carts and checkout without discounting twice", async () => {
  const prefix = `PRICE-TEST-${randomUUID()}`;
  const sessionId = `${prefix}-cart`;
  const ids: string[] = [];
  try {
    const product = await storage.createProduct({
      name: `${prefix}-product`, slug: `${prefix}-product`.toLowerCase(),
      sku: `${prefix}-OLD`, basePrice: "1000.00",
    });
    ids.push(product.id);
    const medium = await storage.createProductVariant({
      productId: product.id, size: "M", color: "Siyah", sku: `${prefix}-OLD-M`,
      price: "1000.00", stock: 9,
    });
    const large = await storage.createProductVariant({
      productId: product.id, size: "L", color: "Siyah", sku: `${prefix}-OLD-L`,
      price: "1000.00", stock: 4, isActive: false,
    });
    const other = await storage.createProduct({
      name: `${prefix}-other`, slug: `${prefix}-other`.toLowerCase(),
      sku: `${prefix}-OTHER`, basePrice: "500.00",
    });
    ids.push(other.id);
    const collision = await storage.createProductVariant({
      productId: other.id, size: "M", sku: `${prefix}-NEW-M`,
      price: "500.00", stock: 3,
    });
    await storage.addToCart({ sessionId, productId: product.id, variantId: medium.id, quantity: 2 });
    assert.equal((await storage.getCartItems(sessionId))[0].variant.price, "1000.00");

    // Same storage path used by all five bulk-price actions.
    const discountedPrice = (1000 * (1 - 20 / 100)).toFixed(2);
    await storage.updateProduct(product.id, { basePrice: discountedPrice });
    for (const variant of await storage.getProductVariants(product.id)) {
      assert.equal(variant.price, "800.00");
    }
    assert.equal((await storage.getProductVariant(large.id))?.isActive, false);
    assert.equal((await storage.getProductVariant(collision.id))?.price, "500.00");
    const cart = await storage.getCartItems(sessionId);
    assert.equal(cart[0].variant.price, "800.00", "an already-existing cart must see the new price");
    const campaignPricing = await calculateCartCampaign(cart, null);
    assert.equal(campaignPricing.subtotal, 1600);
    assert.equal(campaignPricing.lines[0].unitPrice, 800);
    const checkout = calculateCheckoutPricing(campaignPricing);
    assert.equal(checkout.paymentAmount, 180000, "PayTR amount is 1600 TL products plus 200 TL shipping");

    // Reproduce a legacy mismatch, then heal it from the stored discounted base.
    await db.update(productVariants).set({ price: "1000.00" }).where(eq(productVariants.id, medium.id));
    await storage.updateProduct(product.id, { name: `${prefix}-renamed` });
    assert.equal((await storage.getProduct(product.id))?.basePrice, "800.00");
    assert.equal((await storage.getProductVariant(medium.id))?.price, "800.00", "do not apply another 20% discount");
    assert.equal((await storage.getProductVariant(medium.id))?.stock, 9);
    assert.equal((await storage.getProductVariant(medium.id))?.sku, medium.sku);
    assert.equal((await storage.getProductVariant(large.id))?.stock, 4);

    // SKU conflicts must roll back both the product price and variant prices.
    await assert.rejects(() =>
      storage.updateProduct(product.id, { basePrice: "600.00", sku: `${prefix}-NEW` }),
    );
    assert.equal((await storage.getProduct(product.id))?.basePrice, "800.00");
    assert.equal((await storage.getProduct(product.id))?.sku, `${prefix}-OLD`);
    for (const variant of await storage.getProductVariants(product.id)) {
      assert.equal(variant.price, "800.00");
    }
  } finally {
    await storage.clearCart(sessionId);
    for (const id of ids) await storage.deleteProduct(id);
  }
});
