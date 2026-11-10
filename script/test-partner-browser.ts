import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { storage } from "../server/storage";

const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const code = `BROWSER${suffix}`.toUpperCase();
const username = `browser_${suffix}`;
const password = `Test-${randomUUID()}`;
const adminUsername = `partner_admin_${suffix}`;
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
if (!process.env.REPLIT_DEV_DOMAIN) throw new Error("Development preview domain required");
let couponId = "", orderId = "", adminId = "";
const browser = await chromium.launch({
  headless: true, args: ["--no-sandbox"],
  ...(existsSync("/repl/tools/bin/chromium") ? { executablePath: "/repl/tools/bin/chromium" } : {}),
});
try {
  couponId = String((await db.execute(sql`
    INSERT INTO coupons(code,discount_type,discount_value,is_influencer_code,influencer_name,commission_type,commission_value,total_commission_earned)
    VALUES(${code},'percentage',10,true,${username},'percentage',5,250) RETURNING id
  `)).rows[0].id);
  orderId = String((await db.execute(sql`
    INSERT INTO orders(order_number,customer_name,customer_email,customer_phone,shipping_address,subtotal,total,status,payment_status,coupon_code)
    VALUES(${`TEST-${suffix}`},'Deneme Gizli Müşteri','browser-test@example.invalid','000','{}'::jsonb,1000,1000,'processing','paid',${code})
    RETURNING id
  `)).rows[0].id);
  await storage.redeemCoupon(couponId, orderId, null, 100);
  await db.execute(sql`INSERT INTO order_items(order_id,product_name,variant_details,quantity,price,subtotal) VALUES(${orderId},'HANK Test Forma','M',2,500,1000)`);
  adminId = String((await db.execute(sql`INSERT INTO admin_users(username,password) VALUES(${adminUsername},${await bcrypt.hash(password, 10)}) RETURNING id`)).rows[0].id);
  const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "#replit-dev-banner { display: none !important; }";
      document.head.append(style);
    });
  });
  async function openSection(name: string) {
    const selector = page.getByLabel("Bölüm seç");
    if (await selector.isVisible()) {
      await selector.selectOption({ label: name });
      return;
    }
    await page.getByRole("navigation").getByText(name, { exact: true }).filter({ visible: true }).first().click();
  }
  async function assertFits() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto(`${origin}/partner`);
  await expect(page.getByRole("heading", { name: "Partner Girişi", exact: true })).toBeVisible();
  await expect(page.getByLabel("Kullanıcı adı veya kod")).toBeVisible();
  await expect(page.getByRole("img", { name: "HANK", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("img", { name: "HANK", exact: true }).first()).toHaveAttribute("src", "/uploads/branding/hank-logo.svg");
  const rootBackground = await page.locator("main.partner-root").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(rootBackground.match(/\d+/g)!.map(Number).slice(0, 3).every(channel => channel <= 20)).toBe(true);
  await expect(page.getByRole("button", { name: "Giriş yap", exact: true })).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.getByText("01 / PRIVATE", { exact: true })).toHaveCount(0);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Şifreyi göster", exact: true }).click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Şifreyi gizle", exact: true }).click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "password");
  await page.screenshot({ path: "generated-artifacts/partner-login-mobile.jpg", fullPage: true });
  await page.getByRole("button", { name: "İlk kez giriş yapıyorum", exact: true }).click();
  await page.getByLabel("HANK kodu").fill(code);
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await expect(page.getByLabel("Referans kodu")).toBeVisible();
  await expect(page.getByLabel("Kullanıcı adı", { exact: true })).toHaveCount(0);
  await page.getByLabel("Referans kodu").fill("wrong");
  await page.getByRole("button", { name: /Referansı|Doğrula|Devam et/ }).click();
  await expect(page.getByRole("alert")).toContainText("Referans kodu geçersiz");
  await page.getByLabel("Referans kodu").fill("HANKS");
  await page.getByRole("button", { name: /Referansı|Doğrula|Devam et/ }).click();
  await expect(page.getByLabel("Referans kodu")).toHaveCount(0);
  await page.getByLabel("Kullanıcı adı", { exact: true }).fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Hesabı oluştur", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Genel Bakış", exact: true })).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Partner kodunu kopyala", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  await expect(page.getByText(/HANK Test Forma/).first()).toBeVisible();
  await assertFits();
  await page.screenshot({ path: "generated-artifacts/partner-mobile.jpg", fullPage: true });
  await openSection("Satışlarım");
  await expect(page.getByRole("heading", { name: "Satışlarım", exact: true })).toBeVisible();
  await expect(page.getByText(/Deneme G\. M\./).first()).toBeVisible();
  await expect(page.getByText("Gizli Müşteri", { exact: true })).toHaveCount(0);
  await assertFits();
  await openSection("Çekim Taleplerim");
  await page.getByLabel("Talep tutarı").fill("10,50");
  await page.getByRole("button", { name: /^(Ödeme|Çekim) talebi oluştur$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /talebin alındı/ })).toBeVisible();
  await expect(page.getByText("İncelemede", { exact: true })).toBeVisible();
  await openSection("Satışlarım");
  await page.getByLabel("Başlangıç tarihi").fill("2099-01-01");
  await expect(page.getByText("Bu tarih aralığında satış görünmüyor.", { exact: true })).toBeVisible();
  await page.getByLabel("Başlangıç tarihi").fill("");
  await expect(page.getByText(/HANK Test Forma/).first()).toBeVisible();
  await openSection("Hesabım");
  const updatedPassword = `Test-${randomUUID()}`;
  await page.getByLabel("Mevcut şifre", { exact: true }).fill(password);
  await page.getByLabel("Yeni şifre", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Şifreyi güncelle", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Şifren güncellendi/ })).toBeVisible();
  await openSection("Genel Bakış");
  await page.setViewportSize({ width: 320, height: 568 });
  await assertFits();
  await openSection("Satışlarım");
  await assertFits();
  await openSection("Çekim Taleplerim");
  await assertFits();
  await openSection("Hesabım");
  await assertFits();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openSection("Genel Bakış");
  await assertFits();
  await page.screenshot({ path: "generated-artifacts/partner-desktop.jpg", fullPage: true });
  await page.getByRole("button", { name: "Çıkış yap", exact: true }).filter({ visible: true }).first().click();
  await page.getByLabel("Kullanıcı adı veya kod").fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Genel Bakış", exact: true })).toBeVisible();

  const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  admin.on("dialog", dialog => dialog.accept());
  await admin.goto(`${origin}/toov-admin/login`);
  await admin.locator("#username").fill(adminUsername);
  await admin.locator("#password").fill(password);
  await admin.getByRole("button", { name: /GİRİŞ YAP|Giriş Yap|Giriş yap/ }).click();
  await admin.waitForURL(url => url.pathname === "/toov-admin");
  await admin.goto(`${origin}/toov-admin?tab=influencers`);
  const panel = admin.locator("section").filter({ has: admin.getByRole("heading", { name: /Partner/ }) }).first();
  await expect(panel).toBeVisible();
  const payout = panel.locator("article").filter({ has: admin.getByRole("button", { name: "Manuel ödendi", exact: true }) }).filter({ hasText: code });
  await payout.getByRole("button", { name: "Manuel ödendi", exact: true }).click();
  await expect(panel.locator("article").filter({ hasText: code }).filter({ hasText: "Ödendi" })).toBeVisible();
  const account = panel.locator("article").filter({ has: admin.getByRole("button", { name: "Şifreyi sıfırla", exact: true }) }).filter({ hasText: code });
  await account.getByRole("button", { name: "Şifreyi sıfırla", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Kullanıcı adı veya kod")).toBeVisible();
  await page.getByLabel("Kullanıcı adı veya kod").fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("hatalı");
  expect(pageErrors).toEqual([]);
  console.log("PASS: real browser branded login, password visibility, onboarding, reference validation, section navigation, masked sales, Turkish-decimal withdrawal, date filter, password update/relogin, 320px/mobile/desktop overflow, authenticated admin payment and password reset.");
} finally {
  await browser.close();
  if (orderId) await db.execute(sql`DELETE FROM orders WHERE id=${orderId}`);
  if (couponId) await db.execute(sql`DELETE FROM coupons WHERE id=${couponId}`);
  if (adminId) {
    await db.execute(sql`DELETE FROM refresh_tokens WHERE admin_user_id=${adminId}`);
    await db.execute(sql`DELETE FROM admin_users WHERE id=${adminId}`);
  }
}
