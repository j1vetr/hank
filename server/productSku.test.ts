import assert from "node:assert/strict";
import test from "node:test";
import type { Product, ProductVariant } from "@shared/schema";
import { getOrderItemSkus, planVariantSkuUpdates } from "./productSku";

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

test("invoice code resolution prefers variant codes and falls back to parent products", async () => {
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
  assert.deepEqual([...result], [
    ["a", "CUSTOM"], ["b", "SKU-parent"], ["c", "SKU-simple"], ["d", "SKU-parent"],
  ]);
});
