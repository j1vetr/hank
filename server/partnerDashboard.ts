import { sql } from "drizzle-orm";
import { db } from "./db";
import { eligibleOrder, maskedName, moneyCents } from "./partnerDomain";
import type { PartnerDashboard, PartnerProfile, PartnerWithdrawal } from "@shared/partner";

export const withdrawalView = (r: any): PartnerWithdrawal => ({
  id: r.id, couponId: r.coupon_id, amount: r.amount, status: r.status,
  note: r.note, adminNote: r.admin_note,
  createdAt: new Date(r.created_at).toISOString(),
  processedAt: r.processed_at ? new Date(r.processed_at).toISOString() : null,
});

export async function getPartnerDashboard(partner: PartnerProfile, start?: string, end?: string, page = 1): Promise<PartnerDashboard> {
  const filtered = sql`
    o.id IN (SELECT order_id FROM coupon_redemptions WHERE coupon_id=${partner.couponId})
    ${start ? sql`AND o.created_at >= ((${start}::date::timestamp AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'UTC')` : sql``}
    ${end ? sql`AND o.created_at < (((${end}::date+1)::timestamp AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'UTC')` : sql``}
  `;
  const [saleResult, itemResult, withdrawalResult, paymentResult, balanceResult] = await Promise.all([
    db.execute(sql`
      SELECT o.id,o.order_number,o.customer_name,o.created_at,o.total,o.status,o.payment_status,
        COALESCE(s.code,o.coupon_code,${partner.code}) AS code,
        COALESCE(s.amount,0) AS commission,COALESCE(s.legacy,true) AS estimated,
        COALESCE(s.reversed,false) AS reversed
      FROM orders o LEFT JOIN partner_commissions s ON s.order_id=o.id AND s.coupon_id=${partner.couponId}
      WHERE ${filtered} ORDER BY o.created_at DESC,o.id
    `),
    db.execute(sql`
      SELECT i.order_id,i.product_name,i.variant_details,i.quantity,o.status,o.payment_status,
        NULLIF(p.images->>0,'') AS product_image
      FROM order_items i JOIN orders o ON o.id=i.order_id
      LEFT JOIN products p ON p.id=i.product_id
      WHERE ${filtered}
    `),
    db.execute(sql`SELECT * FROM partner_withdrawals WHERE coupon_id=${partner.couponId} ORDER BY created_at DESC`),
    db.execute(sql`SELECT id,amount,paid_at,note FROM influencer_payments WHERE coupon_id=${partner.couponId} ORDER BY paid_at DESC`),
    db.execute(sql`
      SELECT c.total_commission_earned,
        (SELECT COALESCE(sum(amount),0) FROM partner_withdrawals WHERE coupon_id=c.id AND status='pending') AS reserved
      FROM coupons c WHERE c.id=${partner.couponId}
    `),
  ]);
  const rows = saleResult.rows as any[];
  const items = itemResult.rows as any[];
  const monthly = new Map<string, { count: number; revenue: number; commission: number }>();
  let revenue = 0, commission = 0, count = 0;
  for (const row of rows) {
    const month = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).format(new Date(row.created_at));
    const values = monthly.get(month) || { count: 0, revenue: 0, commission: 0 };
    if (eligibleOrder(row)) {
      const earned = row.reversed ? 0 : moneyCents(row.commission);
      values.count++;
      values.revenue += moneyCents(row.total);
      values.commission += earned;
      count++;
      revenue += moneyCents(row.total);
      commission += earned;
    }
    monthly.set(month, values);
  }
  const productMap = new Map<string, number>();
  for (const item of items) if (eligibleOrder(item)) {
    productMap.set(item.product_name, (productMap.get(item.product_name) || 0) + item.quantity);
  }
  const balance = balanceResult.rows[0] as any;
  const reserved = moneyCents(balance?.reserved);
  const payments = paymentResult.rows as any[];
  return {
    profile: partner,
    summary: {
      orderCount: count, revenue: (revenue / 100).toFixed(2), commissionEarned: (commission / 100).toFixed(2),
      availableBalance: (Math.max(0, moneyCents(balance?.total_commission_earned) - reserved) / 100).toFixed(2),
      reservedBalance: (reserved / 100).toFixed(2),
      paidTotal: (payments.reduce((sum, r) => sum + moneyCents(r.amount), 0) / 100).toFixed(2),
    },
    monthly: Array.from(monthly).sort(([a], [b]) => b.localeCompare(a)).map(([month, r]) => ({
      month, count: r.count, revenue: (r.revenue / 100).toFixed(2), commission: (r.commission / 100).toFixed(2),
    })),
    topProducts: Array.from(productMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, quantity]) => ({ name, quantity })),
    totalSales: rows.length, page,
    sales: rows.slice((page - 1) * 20, page * 20).map(row => ({
      id: row.id, orderNumber: row.order_number, customerName: maskedName(row.customer_name),
      createdAt: new Date(row.created_at).toISOString(), code: row.code, total: row.total,
      status: row.status, paymentStatus: row.payment_status,
      commission: eligibleOrder(row) && !row.reversed ? row.commission : "0.00",
      commissionEstimated: row.estimated,
      items: items.filter(i => i.order_id === row.id).map(i => ({
        productName: i.product_name, productImage: i.product_image ?? null,
        variantDetails: i.variant_details, quantity: i.quantity,
      })),
    })),
    withdrawals: withdrawalResult.rows.map(withdrawalView),
    payments: payments.map(r => ({ id: r.id, amount: r.amount, paidAt: new Date(r.paid_at).toISOString(), note: r.note })),
  };
}
