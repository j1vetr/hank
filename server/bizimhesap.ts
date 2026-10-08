import type { Order, OrderItem } from "@shared/schema";
import { buildBizimHesapInvoice } from "./bizimhesapInvoice";

const BIZIMHESAP_API_URL = "https://bizimhesap.com/api/b2b/addinvoice";

export type InvoiceSendResult =
  | { success: true; guid: string; url?: string }
  | { success: false; status: "failed" | "uncertain"; error: string };

/** Dependency injection allows tests without real credentials or external writes. */
export async function sendInvoiceToBizimHesap(
  order: Order,
  items: OrderItem[],
  itemSkus?: Map<string, string>,
  options: { firmId?: string; fetch?: typeof fetch } = {},
): Promise<InvoiceSendResult> {
  const firmId = options.firmId ?? process.env.BIZIMHESAP_FIRM_ID ?? "";
  if (!firmId) return { success: false, status: "failed", error: "BizimHesap yapılandırması eksik." };
  let payload: ReturnType<typeof buildBizimHesapInvoice>;
  try {
    payload = buildBizimHesapInvoice(order, items, itemSkus, firmId);
  } catch (error) {
    return { success: false, status: "failed", error: error instanceof Error ? error.message : "Fatura bilgileri geçersiz." };
  }
  try {
    const response = await (options.fetch ?? fetch)(BIZIMHESAP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    const body = await response.json() as Record<string, unknown> | null;
    if (response.ok && body && typeof body.guid === "string" && body.guid.trim() && !body.error) {
      let url: string | undefined;
      if (typeof body.url === "string") {
        try {
          const parsed = new URL(body.url);
          if (parsed.protocol === "https:") url = parsed.href;
        } catch { /* A GUID still proves creation even if the optional URL is invalid. */ }
      }
      return { success: true, guid: body.guid.trim(), url };
    }
    // Only the documented error response with empty identifiers proves rejection.
    if (response.status < 500 && body && typeof body.error === "string" && body.error.trim() && body.guid === "" && body.url === "") {
      return { success: false, status: "failed", error: "BizimHesap faturayı reddetti. Fatura bilgilerini ve BizimHesap yapılandırmasını kontrol edin." };
    }
  } catch {
    // A timeout or broken response does not prove that no invoice was created.
  }
  return {
    success: false, status: "uncertain",
    error: "BizimHesap fatura sonucu doğrulanamadı. Tekrar göndermeden önce BizimHesap'ta sipariş numarasıyla kontrol edin.",
  };
}
