import assert from "node:assert/strict";
import test from "node:test";
import type { Product, ProductVariant } from "@shared/schema";
import { buildVariantSkuCheck, getOrderItemCatalogDetails, getOrderItemSkus, planVariantSkuUpdates } from "./productSku";

test("generated codes retain size and color suffixes while custom codes stay unchanged", () => {
  const variants = [
    { id: "size", sku: "OLD-M", size: "M", color: null },
    { id: "color", sku: "OLD-Siyah", size: null, color: "Siyah" },
    { id: "both", sku: "OLD-XL-Kırmızı", size: "XL", color: "Kırmızı" },
    { id: "legacy", sku: "OLD-L", size: "L", color: "Mavi" },
    { id: "base", sku: "OLD", size: null, color: null },
    { id: "custom-prefix", sku: "OLD-SPECIAL", size: "M", color: null },
    { id: "custom", sku: "MANUAL-42", size: "M", color: null },
    { id: "empty", sku: null, size: "M", color: null },
    { id: "already-stale", sku: "EARLIER-M", size: "M", color: null },
  ];
  assert.deepEqual(planVariantSkuUpdates("OLD", "NEW", variants), [
    { id: "size", sku: "NEW-M" },
    { id: "color", sku: "NEW-Siyah" },
    { id: "both", sku: "NEW-XL-Kırmızı" },
    { id: "legacy", sku: "NEW-L" },
    { id: "base", sku: "NEW" },
  ]);
  assert.deepEqual(planVariantSkuUpdates("OLD", "OLD", variants), []);
  assert.deepEqual(planVariantSkuUpdates(null, "NEW", variants), []);
  assert.deepEqual(planVariantSkuUpdates("OLD", null, variants), [
    { id: "size", sku: null },
    { id: "color", sku: null },
    { id: "both", sku: null },
    { id: "legacy", sku: null },
    { id: "base", sku: null },
  ]);
});

test("successive changes use the last product code without dropping suffixes", () => {
  const variant = { id: "v", sku: "OLD-M-Siyah", size: "M", color: "Siyah" };
  const [first] = planVariantSkuUpdates("OLD", "NEW", [variant]);
  assert.deepEqual(planVariantSkuUpdates("NEW", "FINAL", [{ ...variant, ...first }]), [
    { id: "v", sku: "FINAL-M-Siyah" },
  ]);
});

test("invoice codes use current variant codes with product codes as a fallback", async () => {
  const reader = {
    async getProductVariant(id: string) {
      const sku = id === "custom" ? "CUSTOM" : id === "blank" ? " " : null;
      return id === "missing" ? undefined : { sku, productId: "parent" } as ProductVariant;
    },
    async getProduct(id: string) {
      return id === "deleted" ? undefined : { sku: `SKU-${id}` } as Product;
    },
  };
  const result = await getOrderItemSkus([
    { id: "a", variantId: "custom", productId: "parent" },
    { id: "b", variantId: "blank", productId: "parent" },
    { id: "c", variantId: null, productId: "simple" },
    { id: "d", variantId: "missing", productId: "parent" },
    { id: "e", variantId: null, productId: "deleted" },
    { id: "f", variantId: null, productId: null },
  ], reader);
  assert.deepEqual(Array.from(result), [
    ["a", "CUSTOM"], ["b", "SKU-parent"], ["c", "SKU-simple"], ["d", "SKU-parent"],
  ]);
});

test("an old order retains its size suffix after repairing STK3-M to 203-M", async () => {
  let currentSku = "203";
  const variant = { id: "medium", sku: "STK3-M", productId: "tank", size: "M", color: null } as ProductVariant;
  const reader = {
    async getProductVariant() { return variant; },
    async getProduct() {
      return { sku: currentSku, images: ["/tank.jpg"] } as Product;
    },
  };
  const existingOrderItem = { id: "old-order-item", productId: "tank", variantId: "medium" };
  assert.equal((await getOrderItemCatalogDetails(existingOrderItem, reader)).sku, "STK3-M");
  const check = buildVariantSkuCheck({ id: "tank", name: "Tank", sku: currentSku }, [variant]);
  assert.equal(check.variants[0].suggestedSku, "203-M");
  variant.sku = check.variants[0].suggestedSku;
  assert.deepEqual(await getOrderItemCatalogDetails(existingOrderItem, reader), {
    sku: "203-M", productImage: "/tank.jpg",
  });
  assert.equal((await getOrderItemSkus([existingOrderItem], reader)).get(existingOrderItem.id), "203-M");
  const [update] = planVariantSkuUpdates(currentSku, "204", [variant]);
  variant.sku = update.sku;
  currentSku = "204";
  assert.equal((await getOrderItemCatalogDetails(existingOrderItem, reader)).sku, "204-M");
  assert.equal((await getOrderItemSkus([existingOrderItem], reader)).get(existingOrderItem.id), "204-M");
});

test("missing product codes fall back to variant codes without changing catalog data", async () => {
  const variant = { sku: "CUSTOM-M", productId: "parent" } as ProductVariant;
  const reader = {
    async getProductVariant() { return variant; },
    async getProduct(id: string) {
      return id === "deleted" ? undefined : { sku: " ", images: [] } as unknown as Product;
    },
  };
  assert.equal((await getOrderItemCatalogDetails({
    id: "a", productId: "parent", variantId: "v",
  }, reader)).sku, "CUSTOM-M");
  assert.equal((await getOrderItemCatalogDetails({
    id: "b", productId: "deleted", variantId: "v",
  }, reader)).sku, "CUSTOM-M");
  assert.equal(variant.sku, "CUSTOM-M");
});

test("a missing order product link can resolve the variant parent product code", async () => {
  const reader = {
    async getProductVariant() {
      return { sku: "OLD-M", productId: "parent" } as ProductVariant;
    },
    async getProduct(id: string) {
      return id === "parent" ? { sku: "203", images: [] } as unknown as Product : undefined;
    },
  };
  assert.equal((await getOrderItemCatalogDetails({
    id: "a", productId: null, variantId: "v",
  }, reader)).sku, "OLD-M");
  assert.equal((await getOrderItemCatalogDetails({
    id: "b", productId: "deleted", variantId: "v",
  }, reader)).sku, "OLD-M");
});

test("check suggests replacements for already-stale codes and protects unrelated custom codes", () => {
  const check = buildVariantSkuCheck({ id: "p", name: "Product", sku: "203" }, [
    { id: "old", sku: "STK3-M", size: "M", color: null },
    { id: "both", sku: "STK3-L-Siyah", size: "L", color: "Siyah" },
    { id: "legacy", sku: "STK3-XL", size: "XL", color: "Mavi" },
    { id: "correct", sku: "203-S", size: "S", color: null },
    { id: "custom", sku: "MANUAL-42", size: "M", color: null },
    { id: "no-hyphen", sku: "CUSTOMM", size: "M", color: null },
    { id: "empty", sku: null, size: "S", color: "Mavi" },
    { id: "no-attributes", sku: "OLD", size: null, color: null },
  ]);
  assert.deepEqual(check.variants.map(row => [row.id, row.suggestedSku, row.status]), [
    ["old", "203-M", "candidate"],
    ["both", "203-L-Siyah", "candidate"],
    ["legacy", "203-XL", "candidate"],
    ["correct", "203-S", "current"],
    ["custom", null, "custom"],
    ["no-hyphen", null, "custom"],
    ["empty", "203-S-Mavi", "candidate"],
    ["no-attributes", null, "custom"],
  ]);
  assert.equal(check.variants.filter(row => row.needsUpdate).length, 4);
});

test("check is read-only and offers no repairs without a product code", () => {
  const variant = { id: "v", sku: "OLD-M", size: "M", color: null };
  const check = buildVariantSkuCheck({ id: "p", name: "Product", sku: null }, [variant]);
  assert.equal(check.variants[0].needsUpdate, false);
  assert.equal(check.variants[0].suggestedSku, null);
  assert.equal(variant.sku, "OLD-M");
});
