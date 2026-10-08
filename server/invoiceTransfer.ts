import { randomUUID } from "node:crypto";
import type { Order, OrderItem, Product, ProductVariant } from "@shared/schema";
import { sendInvoiceToBizimHesap, type InvoiceSendResult } from "./bizimhesap";
import { getOrderItemSkus } from "./productSku";

export function invoiceTransferView(order: Order) {
  return {
    status: order.invoiceGuid || order.invoiceUrl ? "sent" : order.invoiceStatus,
    guid: order.invoiceGuid, url: order.invoiceUrl, error: order.invoiceError,
    attemptedAt: order.invoiceAttemptedAt, sentAt: order.invoiceSentAt,
  };
}

type InvoiceRepository = {
  getOrder(id: string): Promise<Order | undefined>;
  getOrderItems(id: string): Promise<OrderItem[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductVariant(id: string): Promise<ProductVariant | undefined>;
  claimInvoiceTransfer(id: string, attemptId: string): Promise<Order | undefined>;
  completeInvoiceTransfer(id: string, attemptId: string, result: InvoiceSendResult): Promise<Order | undefined>;
};

type InvoiceSender = (order: Order, items: OrderItem[], skus?: Map<string, string>) => Promise<InvoiceSendResult>;

function existingResult(order: Order) {
  const invoice = invoiceTransferView(order);
  if (invoice.status === "sent") {
    return { success: true as const, reused: true, invoice, guid: invoice.guid, url: invoice.url };
  }
  const messages: Record<string, string> = {
    sending: "Fatura aktarımı başlatılmış. Sonucu kontrol etmeden yeniden gönderilemez.",
    uncertain: "Önceki aktarımın sonucu belirsiz. BizimHesap'ta sipariş numarasıyla kontrol edin.",
    legacy: "Bu eski siparişin önceki aktarım sonucu kayıtlı değil. BizimHesap'ta kontrol edilmeden tekrar gönderilemez.",
  };
  return {
    success: false as const, httpStatus: 409,
    error: messages[invoice.status] || "Fatura başka bir işlem tarafından güncellenmiş. Durumu yenileyin.",
    invoice,
  };
}

/** All automatic/manual sends use one persisted, atomic acquisition gate. */
export async function sendTrackedInvoice(
  orderId: string,
  repository: InvoiceRepository,
  sender: InvoiceSender = sendInvoiceToBizimHesap,
) {
  const order = await repository.getOrder(orderId);
  if (!order) return { success: false as const, httpStatus: 404, error: "Sipariş bulunamadı." };
  if (order.invoiceGuid || order.invoiceUrl || !["not_sent", "failed"].includes(order.invoiceStatus)) {
    return existingResult(order);
  }
  if (order.status === "cancelled" || order.paymentStatus === "refunded") {
    return { success: false as const, httpStatus: 400, error: "İptal veya iade edilmiş sipariş için fatura aktarılamaz.", invoice: invoiceTransferView(order) };
  }
  const attemptId = randomUUID();
  const claimed = await repository.claimInvoiceTransfer(orderId, attemptId);
  if (!claimed) {
    const current = await repository.getOrder(orderId);
    return current ? existingResult(current) : { success: false as const, httpStatus: 404, error: "Sipariş bulunamadı." };
  }
  let items: OrderItem[];
  let skus: Map<string, string>;
  try {
    items = await repository.getOrderItems(orderId);
    skus = await getOrderItemSkus(items, repository);
  } catch {
    const failure: InvoiceSendResult = { success: false, status: "failed", error: "Fatura ürün bilgileri hazırlanamadı. Yeniden deneyebilirsiniz." };
    const saved = await repository.completeInvoiceTransfer(orderId, attemptId, failure);
    if (!saved) throw new Error("Invoice preparation result could not be saved");
    return { success: false as const, httpStatus: 400, error: failure.error, invoice: invoiceTransferView(saved) };
  }
  let result: InvoiceSendResult;
  try {
    result = await sender(claimed, items, skus);
  } catch {
    result = { success: false, status: "uncertain", error: "Aktarım sonucu belirsiz. Tekrar göndermeden önce BizimHesap'ta kontrol edin." };
  }
  const saved = await repository.completeInvoiceTransfer(orderId, attemptId, result);
  // If persistence failed, the durable sending state still prevents a second POST.
  if (!saved) throw new Error("Invoice transfer result could not be saved");
  const invoice = invoiceTransferView(saved);
  if (result.success) {
    return { success: true as const, reused: false, guid: result.guid, url: result.url, invoice };
  }
  return { success: false as const, httpStatus: result.status === "uncertain" ? 409 : 400, error: result.error, invoice };
}
