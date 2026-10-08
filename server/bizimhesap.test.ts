import assert from "node:assert/strict";
import test from "node:test";
import type { Order, OrderItem } from "@shared/schema";
import { buildBizimHesapInvoice } from "./bizimhesapInvoice";
import { sendInvoiceToBizimHesap, type InvoiceSendResult } from "./bizimhesap";
import { invoiceTransferView, sendTrackedInvoice } from "./invoiceTransfer";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "test-order", orderNumber: "TEST-INVOICE", customerName: "Test",
    customerEmail: "test@example.invalid", customerPhone: "",
    shippingAddress: { address: "Test", city: "Test", district: "Test", postalCode: "00000" },
    subtotal: "3000.00", shippingCost: "0.00", discountAmount: "0.00", total: "2500.00",
    campaignDiscountAmount: "500.00",
    campaignDiscountDetails: { campaignName: "2+1", discountedItems: [
      { productId: "reward", variantId: "reward-M", quantity: 1, discountAmount: "500.00" },
    ] },
    status: "confirmed", paymentStatus: "paid", invoiceStatus: "not_sent",
    invoiceGuid: null, invoiceUrl: null, invoiceError: null, invoiceAttemptId: null,
    invoiceAttemptedAt: null, invoiceSentAt: null, ...overrides,
  } as Order;
}

function items(): OrderItem[] {
  return [
    { id: "trigger-line", orderId: "test-order", productId: "trigger", variantId: "trigger-M",
      productName: "Trigger", variantDetails: "M", quantity: 2, price: "1000.00", subtotal: "2000.00" },
    { id: "reward-line", orderId: "test-order", productId: "reward", variantId: "reward-M",
      productName: "Reward", variantDetails: "M", quantity: 1, price: "1000.00", subtotal: "1000.00" },
  ] as OrderItem[];
}

test("campaign discount is applied only to the recorded reward product and retains variant SKU", () => {
  const payload = buildBizimHesapInvoice(order(), items(), new Map([["reward-line", "203-M"]]), "test-firm");
  assert.equal(payload.details[0].total, "2000.00");
  assert.equal(payload.details[0].discount, "0.00");
  assert.equal(payload.details[1].total, "500.00");
  assert.equal(payload.details[1].productId, "203-M");
  assert.match(payload.details[1].note, /Kampanya indirimi: 500.00 TL/);
  assert.equal(payload.amounts.total, "2500.00");
  assert.equal(Number(payload.amounts.net) + Number(payload.amounts.tax), 2500);
  assert.equal(Math.round((Number(payload.amounts.gross) - Number(payload.amounts.discount)) * 100),
    Math.round(Number(payload.amounts.net) * 100));
});

test("campaign plus coupon plus shipping reconcile exactly to the paid total", () => {
  const payload = buildBizimHesapInvoice(order({
    discountAmount: "250.00", shippingCost: "200.00", total: "2450.00",
  }), items());
  assert.equal(payload.details[0].total, "1800.00");
  assert.equal(payload.details[1].total, "450.00");
  assert.equal(payload.details[2].total, "200.00");
  assert.equal(payload.details[2].taxRate, "20.00");
  assert.equal(payload.details.reduce((sum, line) => sum + Number(line.total), 0), 2450);
});

test("coupon covering products and shipping creates a valid zero-total invoice", () => {
  const payload = buildBizimHesapInvoice(order({
    discountAmount: "2700.00", shippingCost: "200.00", total: "0.00",
  }), items());
  assert.equal(payload.amounts.total, "0.00");
  assert.ok(payload.details.every(line => line.net === "0.00" && line.tax === "0.00" && line.total === "0.00"));
});

test("campaign snapshot identifies the exact variant rather than discounting another variant", () => {
  const lines = items();
  lines[0] = { ...lines[0], productId: "reward", variantId: "reward-L" };
  const payload = buildBizimHesapInvoice(order(), lines);
  assert.equal(payload.details[0].total, "2000.00");
  assert.equal(payload.details[1].total, "500.00");
});

test("legacy campaign snapshots without variant IDs still discount only their recorded product", () => {
  const payload = buildBizimHesapInvoice(order({
    campaignDiscountDetails: { campaignName: "2+1", discountedItems: [
      { productId: "reward", quantity: 1, discountAmount: "500.00" },
    ] },
  }), items());
  assert.equal(payload.details[0].total, "2000.00");
  assert.equal(payload.details[1].total, "500.00");
});

test("rounding and international tax reconcile to the cent", () => {
  const lines = [{ ...items()[0], quantity: 3, price: "0.01", subtotal: "0.03" }];
  const payload = buildBizimHesapInvoice(order({
    subtotal: "0.03", campaignDiscountAmount: "0.00", campaignDiscountDetails: null,
    discountAmount: "0.01", total: "0.02",
    shippingAddress: { address: "Test", city: "Test", district: "Test", postalCode: "00000", country: "Germany" },
  }), lines);
  assert.equal(payload.details[0].total, "0.02");
  assert.equal(payload.details[0].tax, "0.00");
  assert.equal(payload.details[0].discount, "0.01");
});

test("invalid or incomplete discount snapshots and inconsistent totals fail before transmission", () => {
  assert.throws(() => buildBizimHesapInvoice(order({ total: "2499.99" }), items()), /toplam/);
  assert.throws(() => buildBizimHesapInvoice(order({ campaignDiscountDetails: null }), items()), /detay/);
  assert.throws(() => buildBizimHesapInvoice(order({
    campaignDiscountDetails: { campaignName: "2+1", discountedItems: [
      { productId: "missing", quantity: 1, discountAmount: "500.00" },
    ] },
  }), items()), /eşleştiril/);
  assert.throws(() => buildBizimHesapInvoice(order(), [{ ...items()[0], quantity: 0 }]), /adedi/);
});

const responseFetch = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

test("a provider success requires a valid identifier, not just HTTP 200", async () => {
  const success = await sendInvoiceToBizimHesap(order(), items(), undefined, {
    firmId: "test-firm", fetch: responseFetch({ error: "", guid: "invoice-guid", url: "https://bizimhesap.com/test" }),
  });
  assert.equal(success.success, true);
  for (const body of [{}, { error: "", guid: "", url: "" }]) {
    const result = await sendInvoiceToBizimHesap(order(), items(), undefined, {
      firmId: "test-firm", fetch: responseFetch(body),
    });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.status, "uncertain");
  }
});

test("documented rejection is retryable but network, server and malformed outcomes are uncertain", async () => {
  const rejected = await sendInvoiceToBizimHesap(order(), items(), undefined, {
    firmId: "test-firm", fetch: responseFetch({ error: "Invalid", guid: "", url: "" }, 400),
  });
  assert.equal(rejected.success, false);
  if (!rejected.success) assert.equal(rejected.status, "failed");
  const mocks: typeof fetch[] = [
    (async () => { throw new Error("Timeout"); }) as typeof fetch,
    responseFetch({}, 500),
    responseFetch({ error: "Server error", guid: "", url: "" }, 500),
    (async () => new Response("not-json")) as typeof fetch,
  ];
  for (const mock of mocks) {
    const result = await sendInvoiceToBizimHesap(order(), items(), undefined, { firmId: "test-firm", fetch: mock });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.status, "uncertain");
  }
});

test("preflight failures never call the external API", async () => {
  let calls = 0;
  const result = await sendInvoiceToBizimHesap(order({ total: "1.00" }), items(), undefined, {
    firmId: "test-firm", fetch: (async () => { calls++; throw new Error("must not call"); }) as typeof fetch,
  });
  assert.equal(calls, 0);
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.status, "failed");
});

test("successful invoice identifiers are saved without allowing unsafe links", async () => {
  const result = await sendInvoiceToBizimHesap(order(), items(), undefined, {
    firmId: "test-firm", fetch: responseFetch({ error: "", guid: "saved-guid", url: "javascript:alert(1)" }),
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.guid, "saved-guid");
    assert.equal(result.url, undefined);
  }
});

function repository(initial = order()) {
  let current = { ...initial };
  return {
    async getOrder() { return { ...current }; },
    async getOrderItems() { return items(); },
    async getProduct() { return undefined; },
    async getProductVariant() { return undefined; },
    async claimInvoiceTransfer(_id: string, attemptId: string) {
      if (!["not_sent", "failed"].includes(current.invoiceStatus) || current.invoiceGuid || current.invoiceUrl) return undefined;
      current = { ...current, invoiceStatus: "sending", invoiceAttemptId: attemptId, invoiceAttemptedAt: new Date(), invoiceError: null };
      return { ...current };
    },
    async completeInvoiceTransfer(_id: string, attemptId: string, result: InvoiceSendResult) {
      if (current.invoiceAttemptId !== attemptId || current.invoiceStatus !== "sending") return undefined;
      current = result.success
        ? { ...current, invoiceStatus: "sent", invoiceGuid: result.guid, invoiceUrl: result.url || null, invoiceSentAt: new Date() }
        : { ...current, invoiceStatus: result.status, invoiceError: result.error };
      return { ...current };
    },
  };
}

test("parallel automatic/manual submissions produce exactly one external send and persist its result", async () => {
  const repo = repository();
  let calls = 0;
  const sender = async (): Promise<InvoiceSendResult> => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { success: true, guid: "saved-guid", url: "https://bizimhesap.com/test" };
  };
  const results = await Promise.all([
    sendTrackedInvoice("test-order", repo, sender), sendTrackedInvoice("test-order", repo, sender),
  ]);
  assert.equal(calls, 1);
  assert.equal(results.filter(result => result.success).length, 1);
  assert.equal(invoiceTransferView((await repo.getOrder())!).status, "sent");
  assert.equal((await repo.getOrder())!.invoiceGuid, "saved-guid");
  const again = await sendTrackedInvoice("test-order", repo, sender);
  assert.equal(again.success, true);
  if (again.success) assert.equal(again.reused, true);
  assert.equal(calls, 1);
});

test("legacy, uncertain, sending and already-linked orders never transmit another invoice", async () => {
  let calls = 0;
  const sender = async (): Promise<InvoiceSendResult> => { calls++; return { success: true, guid: "x" }; };
  for (const status of ["legacy", "uncertain", "sending", "sent"]) {
    await sendTrackedInvoice("test-order", repository(order({ invoiceStatus: status })), sender);
  }
  await sendTrackedInvoice("test-order", repository(order({ invoiceStatus: "not_sent", invoiceUrl: "https://bizimhesap.com/existing" })), sender);
  assert.equal(calls, 0);
});

test("explicit rejection can retry, but an uncertain send cannot", async () => {
  const repo = repository();
  await sendTrackedInvoice("test-order", repo, async () => ({ success: false, status: "failed", error: "Rejected" }));
  const retry = await sendTrackedInvoice("test-order", repo, async () => ({ success: true, guid: "ok" }));
  assert.equal(retry.success, true);
  const unknown = repository();
  await sendTrackedInvoice("test-order", unknown, async () => { throw new Error("unknown network outcome"); });
  const blocked = await sendTrackedInvoice("test-order", unknown, async () => { throw new Error("must not retry"); });
  assert.equal(blocked.success, false);
  assert.equal((await unknown.getOrder()).invoiceStatus, "uncertain");
});
