export type SkuCheckVariant = {
  id: string;
  size: string | null;
  color: string | null;
  currentSku: string | null;
  suggestedSku: string | null;
  status: "current" | "candidate" | "custom";
  needsUpdate: boolean;
};

export type SkuProductCheck = {
  product: { id: string; name: string; sku: string | null };
  variants: SkuCheckVariant[];
};

export type BulkSkuCheck = {
  checkedProducts: number;
  totalVariants: number;
  candidateCount: number;
  currentCount: number;
  customCount: number;
  missingSkuProducts: number;
  products: SkuProductCheck[];
};

export type BulkSkuSelection = {
  productId: string;
  expectedProductSku: string;
  variants: {
    id: string;
    expectedCurrentSku: string | null;
    expectedSuggestedSku: string;
  }[];
};

export type BulkSkuRepairOutcome = {
  productId: string;
  status: "updated" | "failed" | "uncertain" | "skipped";
  updatedCount: number;
  message: string;
};

export function isBulkSkuCheck(value: unknown): value is BulkSkuCheck {
  if (!value || typeof value !== "object") return false;
  const data = value as BulkSkuCheck;
  const nullableString = (item: unknown) => item === null || typeof item === "string";
  return [
    data.checkedProducts, data.totalVariants, data.candidateCount, data.currentCount,
    data.customCount, data.missingSkuProducts,
  ].every(count => Number.isSafeInteger(count) && count >= 0) &&
    Array.isArray(data.products) && data.products.every(check =>
      check && check.product && typeof check.product.id === "string" &&
      typeof check.product.name === "string" && nullableString(check.product.sku) &&
      Array.isArray(check.variants) && check.variants.every(row =>
        row && typeof row.id === "string" && nullableString(row.size) && nullableString(row.color) &&
        nullableString(row.currentSku) && nullableString(row.suggestedSku) &&
        ["current", "candidate", "custom"].includes(row.status) && typeof row.needsUpdate === "boolean",
      ),
    );
}

type BulkSkuRepairOptions = {
  request?: typeof fetch;
  /** Stop before the next product, not halfway through a database transaction. */
  signal?: AbortSignal;
  onStart?: (productId: string, index: number, total: number) => void;
  onResult?: (result: BulkSkuRepairOutcome) => void;
};

/**
 * Reuse the individually guarded endpoint, strictly one product at a time.
 * A lost response is not reported as success and is never blindly retried.
 */
export async function runBulkSkuRepair(
  selections: BulkSkuSelection[],
  options: BulkSkuRepairOptions = {},
): Promise<BulkSkuRepairOutcome[]> {
  const results: BulkSkuRepairOutcome[] = [];
  let stopReason: string | null = null;
  for (let index = 0; index < selections.length; index++) {
    const selection = selections[index];
    let result: BulkSkuRepairOutcome;
    if (stopReason || options.signal?.aborted) {
      result = {
        productId: selection.productId, status: "skipped", updatedCount: 0,
        message: stopReason || "İşlem durduruldu. Bu ürün değiştirilmedi.",
      };
    } else {
      options.onStart?.(selection.productId, index, selections.length);
      try {
        // The stop button deliberately does not abort an in-flight mutation.
        const response = await (options.request ?? fetch)(
          `/api/admin/products/${encodeURIComponent(selection.productId)}/repair-skus`,
          {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expectedProductSku: selection.expectedProductSku,
              variants: selection.variants,
            }),
          },
        );
        let body: { error?: unknown; updatedCount?: unknown } | null = null;
        try { body = await response.json(); } catch { /* Classify the HTTP result below. */ }
        if (!response.ok) {
          const uncertain = response.status >= 500;
          result = {
            productId: selection.productId, status: uncertain ? "uncertain" : "failed", updatedCount: 0,
            message: uncertain
              ? "Güncelleme sonucu doğrulanamadı. Yeni kontrol yapmadan tekrar denemeyin."
              : typeof body?.error === "string" ? body.error : "Ürün güncellenemedi.",
          };
          if (uncertain || response.status === 401 || response.status === 403) {
            stopReason = uncertain
              ? "Bağlantı veya sunucu sorunu nedeniyle bu ürün işlenmedi."
              : "Oturum veya yetki sorunu nedeniyle bu ürün işlenmedi.";
          }
        } else if (body?.updatedCount !== selection.variants.length) {
          result = {
            productId: selection.productId, status: "uncertain", updatedCount: 0,
            message: "Güncelleme yanıtı doğrulanamadı. Stok kodlarını yeniden kontrol edin.",
          };
          stopReason = "Önceki ürünün sonucu doğrulanamadığı için bu ürün işlenmedi.";
        } else {
          result = {
            productId: selection.productId, status: "updated",
            updatedCount: selection.variants.length,
            message: `${selection.variants.length} varyantın stok kodu güncellendi.`,
          };
        }
      } catch {
        result = {
          productId: selection.productId, status: "uncertain", updatedCount: 0,
          message: "Bağlantı kesildi. Sonuç bilinmiyor. Yeni kontrol yapmadan tekrar denemeyin.",
        };
        stopReason = "Bağlantı sorunu nedeniyle bu ürün işlenmedi.";
      }
    }
    results.push(result);
    options.onResult?.(result);
  }
  return results;
}
