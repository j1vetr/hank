import { z } from "zod";
import type { BizimHesapCollectionSettings, Order } from "@shared/schema";

const cashIdSchema = z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
const cashierSchema = z.object({
  id: cashIdSchema,
  title: z.string().trim().min(1).max(250),
});
const cashiersResponseSchema = z.object({
  // The authenticated, read-only provider response uses 1 for success.
  resultCode: z.literal(1),
  errorText: z.string().refine(value => value.trim() === ""),
  data: z.object({ cashiers: z.array(cashierSchema) }),
});

export type BizimHesapCashier = z.infer<typeof cashierSchema>;
export type CollectionSettingsInput = Pick<BizimHesapCollectionSettings, "enabled" | "cashId" | "cashTitle">;

export const collectionSettingsRequestSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(true), cashId: cashIdSchema }).strict(),
  z.object({ enabled: z.literal(false) }).strict(),
]);

export function collectionSettingsView(settings?: BizimHesapCollectionSettings) {
  return {
    enabled: settings?.enabled ?? false,
    cashId: settings?.cashId ?? null,
    cashTitle: settings?.cashTitle ?? null,
    updatedAt: settings?.updatedAt ?? null,
  };
}

/** No tokens, provider bodies, or request objects may escape this boundary. */
export async function listBizimHesapCashiers(
  options: { firmId?: string; fetch?: typeof fetch } = {},
): Promise<BizimHesapCashier[]> {
  const token = options.firmId ?? process.env.BIZIMHESAP_FIRM_ID;
  if (!token) throw new Error("BizimHesap yapılandırması eksik. Kasalar alınamadı.");
  try {
    // The documented host returns 308 to this provider-owned canonical host.
    // Call it directly instead of forwarding the token across arbitrary redirects.
    const response = await (options.fetch ?? fetch)("https://uygulama.bizimhesap.com/api/b2b/cashiers", {
      method: "GET",
      headers: { token },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Upstream HTTP failure");
    const parsed = cashiersResponseSchema.parse(await response.json());
    const ids = new Set<string>();
    for (const cashier of parsed.data.cashiers) {
      if (ids.has(cashier.id)) throw new Error("Duplicate cashier identifier");
      ids.add(cashier.id);
    }
    return parsed.data.cashiers;
  } catch {
    throw new Error("BizimHesap kasaları alınamadı. Bağlantıyı kontrol edip tekrar deneyin.");
  }
}

/** Only the verified PayTR callback may opt in, at creation of the order. */
export function captureInvoiceCashier(
  order: Pick<Order, "paymentMethod" | "paymentStatus" | "status" | "total">,
  settings?: CollectionSettingsInput,
  verifiedPaytrPayment = false,
) {
  if (
    !verifiedPaytrPayment || !settings?.enabled || !settings.cashId || !settings.cashTitle ||
    order.paymentMethod !== "credit_card" || order.paymentStatus !== "paid" ||
    order.status === "cancelled" || !Number.isFinite(Number(order.total)) || !(Number(order.total) > 0)
  ) return { invoiceCashId: null, invoiceCashTitle: null };
  return {
    invoiceCashId: cashIdSchema.parse(settings.cashId),
    invoiceCashTitle: settings.cashTitle,
  };
}

/** Never attach the current global setting while resending an existing invoice. */
export function invoiceCashierFields(order: Order): { CashId?: string } {
  if (!order.invoiceCashId) return {};
  if (order.paymentMethod !== "credit_card" || order.paymentStatus !== "paid" ||
    order.status === "cancelled" || !Number.isFinite(Number(order.total)) || !(Number(order.total) > 0)) {
    throw new Error("Kasa bilgili fatura için başarılı ve pozitif tutarlı kredi kartı ödemesi gerekli.");
  }
  const parsed = cashIdSchema.safeParse(order.invoiceCashId);
  if (!parsed.success) throw new Error("Siparişin kayıtlı BizimHesap kasa bilgisi geçersiz.");
  return { CashId: parsed.data };
}
