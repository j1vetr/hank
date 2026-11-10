import { sql } from "drizzle-orm";
import { db } from "./db";
import { commissionFor, eligibleOrder, moneyCents, PartnerError } from "./partnerDomain";

export type PartnerTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Caller locks the order before the coupon. All balance mutations lock the coupon. */
export async function syncPartnerCommission(tx: PartnerTx, orderId: string) {
  const row = (await tx.execute(sql`
    SELECT o.id, o.total, o.status, o.payment_status, c.id AS coupon_id,
      c.code, c.commission_type, c.commission_value
    FROM orders o JOIN coupon_redemptions r ON r.order_id=o.id
    JOIN coupons c ON c.id=r.coupon_id
    WHERE o.id=${orderId} AND c.is_influencer_code=true LIMIT 1
  `)).rows[0] as any;
  if (!row) return;
  await tx.execute(sql`SELECT id FROM coupons WHERE id=${row.coupon_id} FOR UPDATE`);
  let snapshot = (await tx.execute(sql`SELECT * FROM partner_commissions WHERE order_id=${orderId}`)).rows[0] as any;
  // Existing redemptions are frozen by the migration below, never credited again.
  if (!snapshot) {
    snapshot = (await tx.execute(sql`
      INSERT INTO partner_commissions(order_id,coupon_id,amount,code)
      VALUES(${orderId},${row.coupon_id},${commissionFor(row.total, row.commission_type, row.commission_value)},${row.code})
      RETURNING *
    `)).rows[0];
  }
  const eligible = eligibleOrder(row);
  if (eligible && !snapshot.credited && !snapshot.reversed) {
    await tx.execute(sql`UPDATE coupons SET total_commission_earned=COALESCE(total_commission_earned,0)+${snapshot.amount}::numeric WHERE id=${row.coupon_id}`);
    await tx.execute(sql`UPDATE partner_commissions SET credited=true WHERE order_id=${orderId}`);
  } else if (!eligible && snapshot.credited && !snapshot.reversed) {
    // Negative balances represent a refund of already-paid commission. Never discard this debt.
    await tx.execute(sql`UPDATE coupons SET total_commission_earned=COALESCE(total_commission_earned,0)-${snapshot.amount}::numeric WHERE id=${row.coupon_id}`);
    await tx.execute(sql`UPDATE partner_commissions SET reversed=true WHERE order_id=${orderId}`);
  }
}

export async function reserveWithdrawal(couponId: string, amount: string, note?: string) {
  return db.transaction(async tx => {
    const c = (await tx.execute(sql`SELECT * FROM coupons WHERE id=${couponId} AND is_influencer_code=true FOR UPDATE`)).rows[0] as any;
    if (!c) throw new PartnerError("Partner bulunamadı", 404);
    const reserved = (await tx.execute(sql`SELECT COALESCE(sum(amount),0) AS amount FROM partner_withdrawals WHERE coupon_id=${couponId} AND status='pending'`)).rows[0] as any;
    if (moneyCents(amount) > moneyCents(c.total_commission_earned) - moneyCents(reserved.amount)) {
      throw new PartnerError("Talep tutarı kullanılabilir bakiyenizi aşıyor");
    }
    const result = await tx.execute(sql`
      INSERT INTO partner_withdrawals(coupon_id,amount,note) VALUES(${couponId},${amount}::numeric,${note || null}) RETURNING id
    `);
    return { id: result.rows[0].id };
  });
}

export async function processWithdrawal(id: string, status: "paid" | "rejected", note?: string) {
  return db.transaction(async tx => {
    const initial = (await tx.execute(sql`SELECT coupon_id FROM partner_withdrawals WHERE id=${id}`)).rows[0] as any;
    if (!initial) throw new PartnerError("Talep bulunamadı", 404);
    const c = (await tx.execute(sql`SELECT * FROM coupons WHERE id=${initial.coupon_id} FOR UPDATE`)).rows[0] as any;
    const request = (await tx.execute(sql`SELECT * FROM partner_withdrawals WHERE id=${id} FOR UPDATE`)).rows[0] as any;
    if (request.status !== "pending") throw new PartnerError("Bu talep zaten işleme alınmış", 409);
    if (status === "paid") {
      const reserved = (await tx.execute(sql`SELECT COALESCE(sum(amount),0) AS amount FROM partner_withdrawals WHERE coupon_id=${c.id} AND status='pending'`)).rows[0] as any;
      if (moneyCents(c.total_commission_earned) < moneyCents(reserved.amount)) {
        throw new PartnerError("İptal veya iade nedeniyle bakiye yetersiz. Önce bekleyen talepleri gözden geçirin", 409);
      }
      await tx.execute(sql`UPDATE coupons SET total_commission_earned=total_commission_earned-${request.amount}::numeric, updated_at=now() WHERE id=${c.id}`);
      await tx.execute(sql`INSERT INTO influencer_payments(coupon_id,amount,note) VALUES(${c.id},${request.amount}::numeric,${`Partner çekim talebi ${id}${note ? `: ${note}` : ""}`})`);
    }
    await tx.execute(sql`UPDATE partner_withdrawals SET status=${status},admin_note=${note || null},processed_at=now() WHERE id=${id}`);
    return { success: true };
  });
}

/** Preserve old admin controls, but never let them spend a reserved balance. */
export async function legacyPartnerPayment(couponId: string, adjustment?: number) {
  return db.transaction(async tx => {
    const c = (await tx.execute(sql`SELECT * FROM coupons WHERE id=${couponId} AND is_influencer_code=true FOR UPDATE`)).rows[0] as any;
    if (!c) throw new PartnerError("Partner bulunamadı", 404);
    const pending = (await tx.execute(sql`SELECT id FROM partner_withdrawals WHERE coupon_id=${couponId} AND status='pending' LIMIT 1`)).rows.length;
    if (pending) throw new PartnerError("Bekleyen çekim talepleri var. Önce bu talepleri işleme alın", 409);
    const balance = moneyCents(c.total_commission_earned);
    if (adjustment !== undefined) {
      const cents = moneyCents(adjustment);
      if (cents <= 0 || cents > Math.max(0, balance)) throw new PartnerError("Düzeltme tutarı bakiyeyi aşıyor");
      await tx.execute(sql`UPDATE coupons SET total_commission_earned=total_commission_earned-${(cents / 100).toFixed(2)}::numeric,updated_at=now() WHERE id=${couponId}`);
    } else {
      if (balance <= 0) throw new PartnerError("Ödenebilir bakiye yok");
      await tx.execute(sql`INSERT INTO influencer_payments(coupon_id,amount) VALUES(${couponId},${(balance / 100).toFixed(2)}::numeric)`);
      await tx.execute(sql`UPDATE coupons SET total_commission_earned=0,is_paid=true,paid_at=now(),updated_at=now() WHERE id=${couponId}`);
    }
    return { success: true };
  });
}
