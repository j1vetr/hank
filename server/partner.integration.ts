import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { runPartnerMigration } from "./partnerMigration";
import { registerPartnerRoutes } from "./partnerRoutes";
import { reserveWithdrawal, processWithdrawal, legacyPartnerPayment, syncPartnerCommission } from "./partnerFinance";
import { storage } from "./storage";

test("partner accounts, isolated sales, concurrent payouts, snapshots and admin resets", async () => {
  const balancesBefore = (await db.execute(sql`SELECT COALESCE(sum(total_commission_earned),0)::text AS amount FROM coupons`)).rows[0].amount;
  await runPartnerMigration();
  assert.equal((await db.execute(sql`SELECT COALESCE(sum(total_commission_earned),0)::text AS amount FROM coupons`)).rows[0].amount, balancesBefore);
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const code = `TESTPARTNER${suffix}`;
  const otherCode = `TESTOTHER${suffix}`;
  const username = `test_${suffix}`;
  const password = `Test-${randomUUID()}`;
  const couponIds: string[] = [];
  const orderIds: string[] = [];
  const productIds: string[] = [];
  const app = express();
  app.use(express.json(), cookieParser());
  registerPartnerRoutes(app, (req, res, next) => {
    // Isolated test app only, not mounted in the real application.
    if (req.get("x-test-admin") !== suffix) return res.status(401).json({ error: "Unauthorized" });
    next();
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as any).port;
  let cookie = "";
  async function request(path: string, method = "GET", body?: unknown, admin = false, overrideCookie?: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json", cookie: overrideCookie ?? cookie,
        ...(admin ? { "x-test-admin": suffix } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() as any, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
  }
  try {
    for (const c of [code, otherCode]) {
      const r = await db.execute(sql`
        INSERT INTO coupons(code,discount_type,discount_value,is_influencer_code,influencer_name,commission_type,commission_value,total_commission_earned)
        VALUES(${c},'percentage',10,true,'Test Partner','percentage',5,100) RETURNING id
      `);
      couponIds.push(String(r.rows[0].id));
    }
    const order = async (couponId: string, paid = true) => {
      const r = await db.execute(sql`
        INSERT INTO orders(order_number,customer_name,customer_email,customer_phone,shipping_address,subtotal,shipping_cost,total,status,payment_status,coupon_code)
        VALUES(${`TEST-${randomUUID()}`},'Deneme Gizli Soyad','partner-test@example.invalid','0000000000','{}'::jsonb,1000,0,1000,'processing',${paid ? "paid" : "pending"},${couponId === couponIds[0] ? code : otherCode})
        RETURNING id
      `);
      const id = String(r.rows[0].id);
      orderIds.push(id);
      await storage.redeemCoupon(couponId, id, null, 100);
      return id;
    };
    assert.equal((await request("/api/partner/me")).status, 401);
    assert.equal((await request("/api/admin/partners")).status, 401);
    const look = await request("/api/partner/lookup", "POST", { code });
    assert.equal(look.data.next, "register");
    assert.equal((await request("/api/partner/reference", "POST", { code, referenceCode: "wrong" })).status, 400);
    assert.equal((await request("/api/partner/reference", "POST", { code, referenceCode: "HANKS" })).status, 200);
    assert.equal((await request("/api/partner/register", "POST", { code, referenceCode: "wrong", username, password })).status, 400);
    assert.equal((await request("/api/partner/register", "POST", { code, referenceCode: "HANKS", username: otherCode.toLowerCase(), password })).status, 409);
    const registration = await request("/api/partner/register", "POST", { code, referenceCode: "HANKS", username, password });
    assert.equal(registration.status, 201);
    cookie = registration.cookie;
    assert.ok(cookie);
    assert.equal(registration.data.code, code);
    assert.equal(registration.data.passwordHash, undefined);
    assert.equal((await request("/api/partner/register", "POST", { code, referenceCode: "HANKS", username, password })).status, 409);
    assert.equal((await request("/api/partner/lookup", "POST", { code })).data.next, "login");
    assert.equal((await request("/api/partner/reference", "POST", { code, referenceCode: "HANKS" })).status, 409);

    const saleId = await order(couponIds[0]);
    const otherOrder = await order(couponIds[1]);
    const unpaidId = await order(couponIds[0], false);
    await db.execute(sql`INSERT INTO order_items(order_id,product_name,quantity,price,subtotal,variant_details) VALUES(${saleId},'Test Forma',2,500,1000,'M')`);
    await storage.redeemCoupon(couponIds[0], saleId, null, 100);
    let balance = (await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned;
    assert.equal(balance, "150.00", "duplicate redemption and unpaid order must not accrue");
    let dashboard = await request("/api/partner/dashboard");
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.data.summary.availableBalance, "150.00");
    assert.equal(dashboard.data.summary.orderCount, 1);
    assert.equal(dashboard.data.totalSales, 2);
    assert.ok(!JSON.stringify(dashboard.data).includes(otherOrder));
    assert.ok(!JSON.stringify(dashboard.data).includes("Gizli Soyad"));
    assert.ok(!JSON.stringify(dashboard.data).includes("partner-test@example.invalid"));
    assert.equal(dashboard.data.sales.find((s: any) => s.id === saleId).items[0].productName, "Test Forma");
    assert.equal(dashboard.data.sales.find((s: any) => s.id === saleId).items[0].productImage, null);
    const productId = String((await db.execute(sql`
      INSERT INTO products(name,slug,base_price,images)
      VALUES('Test Forma',${`partner-image-${suffix}`},500,'["/uploads/branding/hank-logo.svg"]'::jsonb)
      RETURNING id
    `)).rows[0].id);
    productIds.push(productId);
    await db.execute(sql`UPDATE order_items SET product_id=${productId} WHERE order_id=${saleId}`);
    dashboard = await request("/api/partner/dashboard");
    assert.equal(dashboard.data.sales.find((s: any) => s.id === saleId).items[0].productImage, "/uploads/branding/hank-logo.svg");
    await db.execute(sql`DELETE FROM products WHERE id=${productId}`);
    dashboard = await request("/api/partner/dashboard");
    assert.equal(dashboard.data.sales.find((s: any) => s.id === saleId).items[0].productImage, null);
    assert.equal(dashboard.data.sales.find((s: any) => s.id === saleId).items[0].productName, "Test Forma");
    assert.equal((await request("/api/partner/dashboard?startDate=2026-02-31")).status, 400);
    assert.equal((await request("/api/partner/dashboard?startDate=2030-01-01&endDate=2020-01-01")).status, 400);
    assert.equal((await request(`/api/partner/dashboard?couponId=${couponIds[1]}`)).status, 400);
    assert.equal((await request("/api/partner/withdrawals", "POST", { amount: "1.001" })).status, 400);
    const concurrent = await Promise.allSettled([
      reserveWithdrawal(couponIds[0], "100.00"), reserveWithdrawal(couponIds[0], "100.00"),
    ]);
    assert.equal(concurrent.filter(r => r.status === "fulfilled").length, 1);
    const requestId = (concurrent.find(r => r.status === "fulfilled") as PromiseFulfilledResult<{ id: unknown }>).value.id as string;
    dashboard = await request("/api/partner/dashboard");
    assert.equal(dashboard.data.summary.availableBalance, "50.00");
    assert.equal(dashboard.data.summary.reservedBalance, "100.00");
    await assert.rejects(legacyPartnerPayment(couponIds[0]), /Bekleyen/);
    await assert.rejects(legacyPartnerPayment(couponIds[0], 10), /Bekleyen/);
    const paymentRace = await Promise.allSettled([
      processWithdrawal(requestId, "paid"), processWithdrawal(requestId, "paid"),
    ]);
    assert.equal(paymentRace.filter(r => r.status === "fulfilled").length, 1);
    assert.equal((await db.execute(sql`SELECT count(*)::int AS n FROM influencer_payments WHERE coupon_id=${couponIds[0]}`)).rows[0].n, 1);
    dashboard = await request("/api/partner/dashboard");
    assert.equal(dashboard.data.summary.paidTotal, "100.00");
    assert.equal(dashboard.data.summary.availableBalance, "50.00");
    const denied = await reserveWithdrawal(couponIds[0], "50.00", "Test");
    await processWithdrawal(String(denied.id), "rejected", "Test ret");
    assert.equal((await request("/api/partner/dashboard")).data.summary.availableBalance, "50.00");

    await db.execute(sql`UPDATE coupons SET commission_value=20 WHERE id=${couponIds[0]}`);
    await storage.updateOrder(unpaidId, { paymentStatus: "paid" });
    await storage.updateOrder(unpaidId, { paymentStatus: "paid" });
    balance = (await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned;
    assert.equal(balance, "100.00", "pending order must earn once using original 5% snapshot");
    await storage.updateOrder(saleId, { status: "cancelled", paymentStatus: "refunded" });
    await storage.updateOrder(saleId, { status: "cancelled", paymentStatus: "refunded" });
    assert.equal((await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned, "50.00");
    const beforeMigration = (await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned;
    await runPartnerMigration();
    assert.equal((await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned, beforeMigration);
    await legacyPartnerPayment(couponIds[0]);
    await storage.updateOrder(unpaidId, { paymentStatus: "refunded" });
    assert.equal((await db.execute(sql`SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}`)).rows[0].total_commission_earned, "-50.00", "refund after payout must retain debt rather than erase it");
    await assert.rejects(reserveWithdrawal(couponIds[0], "0.01"), /bakiyenizi/);
    assert.equal((await request("/api/partner/dashboard")).data.summary.availableBalance, "0.00");

    const beforeReset = cookie;
    assert.equal((await request(`/api/admin/partners/${couponIds[0]}/reset-password`, "POST", {}, true)).status, 200);
    assert.equal((await request("/api/partner/me")).status, 401);
    assert.equal((await request("/api/partner/login", "POST", { identifier: username, password })).status, 401);
    const recreate = await request("/api/partner/register", "POST", { code, referenceCode: "HANKS", username, password });
    assert.equal(recreate.status, 201);
    cookie = recreate.cookie;
    assert.equal((await request("/api/partner/me", "GET", undefined, false, beforeReset)).status, 401);
    assert.equal((await request(`/api/admin/partners/${couponIds[0]}/access`, "PATCH", { enabled: false }, true)).status, 200);
    assert.equal((await request("/api/partner/me")).status, 401);
    assert.equal((await request("/api/partner/login", "POST", { identifier: username, password })).status, 401);
    assert.equal((await request(`/api/admin/partners/${couponIds[0]}/access`, "PATCH", { enabled: true }, true)).status, 200);
    const login = await request("/api/partner/login", "POST", { identifier: code.toLowerCase(), password });
    assert.equal(login.status, 200);
    cookie = login.cookie;
    assert.equal((await request("/api/partner/password", "POST", { currentPassword: "wrong", password: `${password}-new` })).status, 400);
    const changed = await request("/api/partner/password", "POST", { currentPassword: password, password: `${password}-new` });
    assert.equal(changed.status, 200);
    const oldCookie = cookie;
    cookie = changed.cookie;
    assert.equal((await request("/api/partner/me", "GET", undefined, false, oldCookie)).status, 401);
    assert.equal((await request("/api/partner/logout", "POST", {})).status, 200);
    assert.equal((await request("/api/partner/me")).status, 401);
    assert.equal((await request("/api/partner/login", "POST", { identifier: username, password: `${password}-new` })).status, 200);
    const admin = await request("/api/admin/partners", "GET", undefined, true);
    assert.ok(admin.data.accounts.some((a: any) => a.couponId === couponIds[0]));
    assert.ok(!JSON.stringify(admin.data).includes("password_hash"));
    const crossOrigin = await fetch(`http://127.0.0.1:${port}/api/partner/logout`, { method: "POST", headers: { origin: "https://evil.invalid" } });
    assert.equal(crossOrigin.status, 403);
  } finally {
    for (const id of orderIds) await db.execute(sql`DELETE FROM orders WHERE id=${id}`);
    for (const id of couponIds) await db.execute(sql`DELETE FROM coupons WHERE id=${id}`);
    for (const id of productIds) await db.execute(sql`DELETE FROM products WHERE id=${id}`);
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
