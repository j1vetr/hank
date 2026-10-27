import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { insertOrderSchema, type Order, type OrderItem, type BizimHesapCollectionSettings } from "@shared/schema";
import {
  captureInvoiceCashier, invoiceCashierFields, collectionSettingsView, listBizimHesapCashiers,
} from "./bizimhesapCollection";
import { registerBizimHesapCollectionRoutes } from "./bizimhesapCollectionRoutes";
import { buildBizimHesapInvoice } from "./bizimhesapInvoice";
import { sendInvoiceToBizimHesap } from "./bizimhesap";
import { invoiceTransferView } from "./invoiceTransfer";

const config: BizimHesapCollectionSettings = {
  id: 1, enabled: true, cashId: "test-cashier-A", cashTitle: "Test Kredi Kartı Kasası", updatedAt: new Date(),
};
function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "test-collection-order", orderNumber: "TEST-COLLECTION", customerName: "Test",
    customerEmail: "test@example.invalid", customerPhone: "",
    shippingAddress: { address: "Test", city: "Test", district: "Test", postalCode: "00000", country: "TR" },
    subtotal: "1200.00", shippingCost: "0.00", discountAmount: "0.00", total: "1200.00",
    campaignDiscountAmount: "0.00", campaignDiscountDetails: null,
    status: "confirmed", paymentMethod: "credit_card", paymentStatus: "paid", invoiceStatus: "not_sent",
    invoiceGuid: null, invoiceUrl: null, invoiceError: null, invoiceAttemptId: null,
    invoiceAttemptedAt: null, invoiceSentAt: null, invoiceCashId: null, invoiceCashTitle: null, ...overrides,
  } as Order;
}
const items = [{
  id: "line", orderId: "test-collection-order", productId: "product", variantId: "variant-M",
  productName: "Test", variantDetails: "M", price: "600.00", quantity: 2, subtotal: "1200.00",
}] as OrderItem[];

test("cashiers uses only the authenticated GET and parses the observed provider response", async () => {
  let calls = 0;
  const cashiers = await listBizimHesapCashiers({
    firmId: "test-token",
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, "https://uygulama.bizimhesap.com/api/b2b/cashiers");
      assert.equal(options?.method, "GET");
      assert.deepEqual(options?.headers, { token: "test-token" });
      assert.equal(options?.redirect, "error");
      return Response.json({
        resultCode: 1, errorText: "", data: { cashiers: [{ id: config.cashId, title: config.cashTitle, balance: 123 }] },
      });
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(cashiers, [{ id: config.cashId, title: config.cashTitle }]);
});

test("cashier failures and malformed responses fail closed without leaking provider or token contents", async () => {
  for (const response of [
    () => Response.json({ token: "sensitive-test-value" }, { status: 401 }),
    () => Response.json({ resultCode: 0, errorText: "", data: { cashiers: [] } }),
    () => Response.json({ resultCode: 1, errorText: "sensitive-test-value", data: { cashiers: [] } }),
    () => Response.json({ resultCode: 1, errorText: "", data: { cashiers: [{ id: "a", title: "" }] } }),
    () => Response.json({ resultCode: 1, errorText: "", data: { cashiers: [{ id: "a", title: "A" }, { id: "a", title: "B" }] } }),
    () => new Response("not-json"),
  ]) {
    await assert.rejects(listBizimHesapCashiers({ firmId: "sensitive-test-value", fetch: async () => response() }),
      error => error instanceof Error && !/sensitive-test-value/.test(error.message));
  }
  await assert.rejects(listBizimHesapCashiers({ firmId: "", fetch: async () => { throw new Error("must not run"); } }));
  assert.deepEqual(await listBizimHesapCashiers({
    firmId: "test-token",
    fetch: async () => Response.json({ resultCode: 1, errorText: "", data: { cashiers: [] } }),
  }), []);
});

test("only newly verified paid positive PayTR orders capture an enabled cashier", () => {
  assert.deepEqual(captureInvoiceCashier(order(), config, true), {
    invoiceCashId: config.cashId, invoiceCashTitle: config.cashTitle,
  });
  const empty = { invoiceCashId: null, invoiceCashTitle: null };
  assert.deepEqual(captureInvoiceCashier(order(), config), empty);
  assert.deepEqual(captureInvoiceCashier(order(), undefined, true), empty);
  assert.deepEqual(captureInvoiceCashier(order(), { ...config, enabled: false }, true), empty);
  for (const change of [
    { paymentStatus: "pending" }, { paymentStatus: "refunded" }, { paymentStatus: "failed" },
    { paymentMethod: "bank_transfer" }, { status: "cancelled" }, { total: "0.00" },
    { total: "-1.00" }, { total: "not-a-number" },
  ]) assert.deepEqual(captureInvoiceCashier(order(change), config, true), empty);
});

test("public order input cannot supply cashier snapshot fields", () => {
  const parsed = insertOrderSchema.parse({ ...order(), invoiceCashId: "forged", invoiceCashTitle: "Forged" });
  assert.equal("invoiceCashId" in parsed, false);
  assert.equal("invoiceCashTitle" in parsed, false);
});

test("invoice sends the frozen uppercase CashId without changing amounts or requesting AddCollection", async () => {
  const snapshot = captureInvoiceCashier(order(), config, true);
  const paidOrder = order(snapshot);
  const before = buildBizimHesapInvoice(order(), items);
  const payload = buildBizimHesapInvoice(paidOrder, items);
  assert.equal(payload.CashId, config.cashId);
  assert.equal("cashId" in payload, false);
  assert.deepEqual(payload.amounts, before.amounts);
  assert.deepEqual(payload.details, before.details);
  assert.equal("CashId" in before, false);
  let calls = 0;
  const result = await sendInvoiceToBizimHesap(paidOrder, items, undefined, {
    firmId: "test-token",
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, "https://bizimhesap.com/api/b2b/addinvoice");
      const body = JSON.parse(String(options?.body));
      assert.equal(body.CashId, config.cashId);
      assert.equal(body.amounts.total, "1200.00");
      assert.equal(body.customer.customerId, paidOrder.customerEmail);
      return Response.json({ error: "", guid: "test-created-invoice", url: "" });
    },
  });
  assert.equal(result.success, true);
  assert.equal(calls, 1);
  assert.equal(invoiceTransferView(order({ ...snapshot, invoiceGuid: "test-guid", invoiceStatus: "sent" })).collection.status,
    "submitted_with_invoice");
  assert.equal(invoiceTransferView(paidOrder).collection.verified, false);
  assert.equal(invoiceTransferView(order({ ...snapshot, invoiceStatus: "uncertain" })).collection.status, "uncertain");
});

test("cashier snapshots cannot create collection for unpaid, refunded, zero, or cancelled orders", () => {
  for (const overrides of [
    { paymentStatus: "pending" }, { paymentStatus: "refunded" }, { paymentMethod: "bank_transfer" },
    { status: "cancelled" }, { total: "0.00" }, { invoiceCashId: "bad id\\n" },
  ]) assert.throws(() => invoiceCashierFields(order({ invoiceCashId: config.cashId, ...overrides })));
  assert.deepEqual(invoiceCashierFields(order()), {});
  assert.deepEqual(collectionSettingsView(), { enabled: false, cashId: null, cashTitle: null, updatedAt: null });
});

test("admin config routes validate real cashier membership and can deactivate while provider is down", async () => {
  let saved: BizimHesapCollectionSettings | undefined;
  let lists = 0;
  let unavailable = false;
  const app = express();
  app.use(express.json());
  registerBizimHesapCollectionRoutes(app, (req, res, next) => {
    if (req.get("x-test-admin") === "yes") next();
    else res.status(401).json({ error: "Unauthorized" });
  }, {
    async getBizimHesapCollectionSettings() { return saved; },
    async saveBizimHesapCollectionSettings(values) { return saved = { id: 1, ...values, updatedAt: new Date() }; },
  }, async () => {
    lists++;
    if (unavailable) throw new Error("private-provider-message");
    return [{ id: config.cashId!, title: config.cashTitle! }];
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/admin/bizimhesap`;
  const request = (path: string, body?: unknown, auth = true) => fetch(`${base}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { "x-test-admin": "yes" } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    for (const path of ["collection-settings", "cashiers"]) {
      assert.equal((await request(path, undefined, false)).status, 401);
    }
    assert.equal((await request("collection-settings", { enabled: true, cashId: config.cashId }, false)).status, 401);
    assert.equal(lists, 0);
    const initial = await request("collection-settings");
    assert.match(initial.headers.get("cache-control")!, /no-store/);
    assert.equal((await initial.json()).enabled, false);
    assert.equal((await request("collection-settings", { enabled: true })).status, 400);
    assert.equal((await request("collection-settings", { enabled: "true", cashId: config.cashId })).status, 400);
    assert.equal((await request("collection-settings", { enabled: true, cashId: config.cashId, cashTitle: "forged" })).status, 400);
    assert.equal((await request("collection-settings", { enabled: true, cashId: "missing" })).status, 400);
    assert.equal(saved, undefined);
    const enabled = await request("collection-settings", { enabled: true, cashId: config.cashId });
    assert.equal(enabled.status, 200);
    assert.equal((await enabled.json()).cashTitle, config.cashTitle);
    unavailable = true;
    const prior = saved;
    const failed = await request("collection-settings", { enabled: true, cashId: "other-cashier" });
    assert.equal(failed.status, 502);
    assert.equal(saved, prior);
    assert.doesNotMatch(JSON.stringify(await failed.json()), /private-provider-message/);
    const count = lists;
    const disabled = await request("collection-settings", { enabled: false });
    assert.equal(disabled.status, 200);
    assert.equal((await disabled.json()).enabled, false);
    assert.equal(lists, count);
    assert.equal(saved?.cashId, config.cashId);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
