import { eq } from "drizzle-orm";
import { bizimHesapCollectionSettings, orders, type InsertOrder } from "@shared/schema";
import type { db } from "./db";
import { captureInvoiceCashier } from "./bizimhesapCollection";

/** Called inside the same transaction that creates the paid order. */
export async function insertOrderWithCashierSnapshot(
  tx: Pick<typeof db, "select" | "insert">,
  order: InsertOrder,
  verifiedPaytrPayment = false,
) {
  const [settings] = verifiedPaytrPayment
    ? await tx.select().from(bizimHesapCollectionSettings).where(eq(bizimHesapCollectionSettings.id, 1))
    : [];
  const snapshot = captureInvoiceCashier({
    paymentMethod: order.paymentMethod ?? null,
    paymentStatus: order.paymentStatus ?? "pending",
    status: order.status ?? "pending",
    total: order.total,
  }, settings, verifiedPaytrPayment);
  const [created] = await tx.insert(orders).values({ ...order, ...snapshot }).returning();
  return created;
}
