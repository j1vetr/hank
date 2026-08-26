CREATE TABLE IF NOT EXISTS "auto_cart_campaigns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "customer_message" text,
  "is_active" boolean DEFAULT false NOT NULL,
  "starts_at" timestamp,
  "ends_at" timestamp,
  "buy_quantity" integer NOT NULL,
  "reward_quantity" integer NOT NULL,
  "discount_percentage" numeric(5, 2) NOT NULL,
  "scope_type" text DEFAULT 'all' NOT NULL,
  "included_category_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "included_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "excluded_category_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "excluded_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "max_applications" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "campaign_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "campaign_discount_amount" numeric(10, 2) DEFAULT '0';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "campaign_discount_details" jsonb;

ALTER TABLE "pending_payments" ADD COLUMN IF NOT EXISTS "campaign_id" varchar;
ALTER TABLE "pending_payments" ADD COLUMN IF NOT EXISTS "campaign_discount_amount" numeric(10, 2) DEFAULT '0';
ALTER TABLE "pending_payments" ADD COLUMN IF NOT EXISTS "campaign_discount_details" jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_campaign_id_auto_cart_campaigns_id_fk'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_campaign_id_auto_cart_campaigns_id_fk"
      FOREIGN KEY ("campaign_id") REFERENCES "auto_cart_campaigns"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pending_payments_campaign_id_auto_cart_campaigns_id_fk'
  ) THEN
    ALTER TABLE "pending_payments"
      ADD CONSTRAINT "pending_payments_campaign_id_auto_cart_campaigns_id_fk"
      FOREIGN KEY ("campaign_id") REFERENCES "auto_cart_campaigns"("id") ON DELETE SET NULL;
  END IF;
END $$;