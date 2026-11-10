import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runPartnerMigration() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS partner_accounts (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      coupon_id varchar NOT NULL UNIQUE REFERENCES coupons(id) ON DELETE CASCADE,
      username text NOT NULL UNIQUE CHECK (username = lower(username)),
      password_hash text,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS partner_sessions (
      token_hash text PRIMARY KEY,
      account_id varchar NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
      expires_at timestamp NOT NULL
    );
    CREATE INDEX IF NOT EXISTS partner_sessions_account_idx ON partner_sessions(account_id);
    CREATE TABLE IF NOT EXISTS partner_withdrawals (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      coupon_id varchar NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      amount numeric(10,2) NOT NULL CHECK (amount > 0),
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
      note text,
      admin_note text,
      created_at timestamp NOT NULL DEFAULT now(),
      processed_at timestamp
    );
    CREATE INDEX IF NOT EXISTS partner_withdrawals_coupon_idx ON partner_withdrawals(coupon_id, status);
    CREATE TABLE IF NOT EXISTS partner_commissions (
      order_id varchar PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
      coupon_id varchar NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      amount numeric(10,2) NOT NULL CHECK (amount >= 0),
      code text NOT NULL,
      credited boolean NOT NULL DEFAULT false,
      reversed boolean NOT NULL DEFAULT false,
      legacy boolean NOT NULL DEFAULT false
    );
    CREATE INDEX IF NOT EXISTS partner_commissions_coupon_idx ON partner_commissions(coupon_id);
    INSERT INTO partner_commissions(order_id,coupon_id,amount,code,credited,reversed,legacy)
      SELECT DISTINCT ON (o.id) o.id,c.id,
        GREATEST(0,CASE c.commission_type
          WHEN 'percentage' THEN round(o.total * COALESCE(c.commission_value,0)/100,2)
          WHEN 'per_use' THEN COALESCE(c.commission_value,0) ELSE 0 END),
        COALESCE(o.coupon_code,c.code),
        o.status NOT IN ('cancelled','refunded','returned'),
        o.status IN ('cancelled','refunded','returned'),true
      FROM coupon_redemptions r JOIN orders o ON o.id=r.order_id
      JOIN coupons c ON c.id=r.coupon_id WHERE c.is_influencer_code=true
      ORDER BY o.id,r.created_at
      ON CONFLICT(order_id) DO NOTHING;
  `);
}
