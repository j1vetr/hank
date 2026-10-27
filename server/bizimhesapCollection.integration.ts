import assert from "node:assert/strict";
import test, { after } from "node:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { bizimHesapCollectionSettings, orders, insertOrderSchema } from "@shared/schema";
import { runInvoiceTrackingMigration } from "./runMigrations";
import { insertOrderWithCashierSnapshot } from "./bizimhesapOrder";
import { invoiceCashierFields } from "./bizimhesapCollection";

after(async () => { await db.$client.end(); });

test("cashier snapshots persist atomically, ignore later settings, and leave all fixtures rolled back", async () => {
  await runInvoiceTrackingMigration();
  const before = await db.select().from(bizimHesapCollectionSettings);
  const prefix = `CASHIER-TEST-${randomUUID()}`;
  let suffix = 0;
  const input = () => insertOrderSchema.parse({
    orderNumber: `${prefix}-${suffix++}`, customerName: "Test",
    customerEmail: "cashier-test@example.invalid", customerPhone: "",
    shippingAddress: { address: "Test", city: "Test", district: "Test", postalCode: "00000", country: "TR" },
    subtotal: "1200.00", total: "1200.00", status: "confirmed",
    paymentStatus: "paid", paymentMethod: "credit_card",
  });
  const rollback = "INTENTIONAL_CASHIER_TEST_ROLLBACK";
  await assert.rejects(db.transaction(async tx => {
    await tx.insert(bizimHesapCollectionSettings).values({
      id: 1, enabled: false, cashId: null, cashTitle: null,
    }).onConflictDoUpdate({
      target: bizimHesapCollectionSettings.id,
      set: { enabled: false, cashId: null, cashTitle: null },
    });
    const old = await insertOrderWithCashierSnapshot(tx, input(), true);
    assert.equal(old.invoiceCashId, null);
    await tx.update(bizimHesapCollectionSettings).set({
      enabled: true, cashId: "test-cashier-A", cashTitle: "Test Kasa A",
    }).where(eq(bizimHesapCollectionSettings.id, 1));
    const paid = await insertOrderWithCashierSnapshot(tx, input(), true);
    assert.equal(paid.invoiceCashId, "test-cashier-A");
    assert.equal(paid.invoiceCashTitle, "Test Kasa A");
    const generic = await insertOrderWithCashierSnapshot(tx, input());
    assert.equal(generic.invoiceCashId, null);
    const unpaid = await insertOrderWithCashierSnapshot(tx, { ...input(), paymentStatus: "pending" }, true);
    assert.equal(unpaid.invoiceCashId, null);
    await tx.update(bizimHesapCollectionSettings).set({
      cashId: "test-cashier-B", cashTitle: "Test Kasa B",
    }).where(eq(bizimHesapCollectionSettings.id, 1));
    const [reloadedPaid] = await tx.select().from(orders).where(eq(orders.id, paid.id));
    assert.deepEqual(invoiceCashierFields(reloadedPaid), { CashId: "test-cashier-A" });
    const [reloadedOld] = await tx.select().from(orders).where(eq(orders.id, old.id));
    assert.deepEqual(invoiceCashierFields(reloadedOld), {});
    const newer = await insertOrderWithCashierSnapshot(tx, input(), true);
    assert.equal(newer.invoiceCashId, "test-cashier-B");
    await tx.update(bizimHesapCollectionSettings).set({ enabled: false })
      .where(eq(bizimHesapCollectionSettings.id, 1));
    const disabled = await insertOrderWithCashierSnapshot(tx, input(), true);
    assert.equal(disabled.invoiceCashId, null);
    assert.equal(reloadedPaid.total, "1200.00");
    assert.equal(reloadedPaid.invoiceStatus, "not_sent");
    throw new Error(rollback);
  }), new RegExp(rollback));
  assert.deepEqual(await db.select().from(bizimHesapCollectionSettings), before);
  const { sql } = await import("drizzle-orm");
  assert.equal((await db.select().from(orders).where(sql`${orders.orderNumber} LIKE ${prefix + "%"}`)).length, 0);
});
