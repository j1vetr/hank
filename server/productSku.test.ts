import assert from "node:assert/strict";
import test from "node:test";
import type { Product, ProductVariant } from "@shared/schema";
import { getOrderItemCatalogDetails, getOrderItemSkus, planVariantSkuUpdates } from "./productSku";

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

test("invoice codes prefer current product codes over even custom variant codes", async () => {
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
    ["a", "SKU-parent"], ["b", "SKU-parent"], ["c", "SKU-simple"], ["d", "SKU-parent"],
  ]);
});

test("an existing order shows 203 instead of STK3-M and follows subsequent product edits", async () => {
  let currentSku = "203";
  const reader = {
    async getProductVariant() {
      return { sku: "STK3-M", productId: "tank" } as ProductVariant;
    },
    async getProduct() {
      return { sku: currentSku, images: ["/tank.jpg"] } as Product;
    },
  };
  const existingOrderItem = { id: "old-order-item", productId: "tank", variantId: "medium" };
  assert.deepEqual(await getOrderItemCatalogDetails(existingOrderItem, reader), {
    sku: "203", productImage: "/tank.jpg",
  });
  assert.equal((await getOrderItemSkus([existingOrderItem], reader)).get(existingOrderItem.id), "203");
  currentSku = "204";
  assert.equal((await getOrderItemCatalogDetails(existingOrderItem, reader)).sku, "204");
  assert.equal((await getOrderItemSkus([existingOrderItem], reader)).get(existingOrderItem.id), "204");
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
  }, reader)).sku, "203");
  assert.equal((await getOrderItemCatalogDetails({
    id: "b", productId: "deleted", variantId: "v",
  }, reader)).sku, "203");
});
