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
const productIds: string[] = [];
const browser = await chromium.launch({
  headless: true, args: ["--no-sandbox"],
  ...(existsSync("/repl/tools/bin/chromium") ? { executablePath: "/repl/tools/bin/chromium" } : {}),
});
try {
  couponId = String((await db.execute(sql`
    INSERT INTO coupons(code,discount_type,discount_value,is_influencer_code,influencer_name,commission_type,commission_value,total_commission_earned)
    VALUES(${code},'percentage',10,true,'Deneme Uzun Partner Adı Ve Soyadı','percentage',5,12500000.25) RETURNING id
  `)).rows[0].id);
  orderId = String((await db.execute(sql`
    INSERT INTO orders(order_number,customer_name,customer_email,customer_phone,shipping_address,subtotal,total,status,payment_status,coupon_code)
    VALUES(${`TEST-${suffix}-UZUNSIPARISNUMARASI`},'Deneme Gizli Müşteri','browser-test@example.invalid','000','{}'::jsonb,1000,1000,'processing','paid',${code})
    RETURNING id
  `)).rows[0].id);
  await storage.redeemCoupon(couponId, orderId, null, 100);
  for (const [name, image] of [
    ["HANK Test Forma", "/uploads/branding/hank-logo.svg"],
    ["HANK Kırık Görsel Testi", "/uploads/partner-test-missing-photo.webp"],
  ]) {
    const productId = String((await db.execute(sql`
      INSERT INTO products(name,slug,base_price,images)
      VALUES(${name},${`partner-browser-${suffix}-${productIds.length}`},500,${JSON.stringify([image])}::jsonb)
      RETURNING id
    `)).rows[0].id);
    productIds.push(productId);
    await db.execute(sql`
      INSERT INTO order_items(order_id,product_id,product_name,variant_details,quantity,price,subtotal)
      VALUES(${orderId},${productId},${name},'M',1,500,500)
    `);
  }
  await db.execute(sql`
    INSERT INTO order_items(order_id,product_name,quantity,price,subtotal)
    VALUES(${orderId},${`HANK Eski Ürün ${"UZUNÜRÜNADI".repeat(9)}`},1,0,0)
  `);
  adminId = String((await db.execute(sql`INSERT INTO admin_users(username,password) VALUES(${adminUsername},${await bcrypt.hash(password, 10)}) RETURNING id`)).rows[0].id);
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true });
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
    const trigger = page.getByRole("button", { name: "Partner Menüsünü Aç", exact: true });
    if (await trigger.isVisible()) {
      await trigger.click();
      const menu = page.getByRole("dialog", { name: "Partner Menüsü", exact: true });
      await expect(menu).toBeVisible();
      await menu.getByRole("button", { name, exact: true }).click();
      await expect(menu).toBeHidden();
      return;
    }
    await page.getByRole("navigation").getByText(name, { exact: true }).filter({ visible: true }).first().click();
  }
  async function assertFits() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto(`${origin}/partner`);
  await expect(page.getByRole("heading", { name: "Partner Girişi", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Partner Girişi", exact: true })).toHaveCSS("font-family", /Inter/);
  expect(parseFloat(await page.getByLabel(/Kullanıcı adı veya kod/iu).evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await expect(page.getByLabel(/Kullanıcı adı veya kod/iu)).toBeVisible();
  await expect(page.getByRole("img", { name: "HANK", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("img", { name: "HANK", exact: true }).first()).toHaveAttribute("src", "/uploads/branding/hank-logo.svg");
  const rootBackground = await page.locator("main.partner-root").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(rootBackground.match(/\d+/g)!.map(Number).slice(0, 3).every(channel => channel <= 20)).toBe(true);
  await expect(page.getByRole("button", { name: /^Giriş yap$/iu })).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.getByText("01 / PRIVATE", { exact: true })).toHaveCount(0);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^Şifreyi göster$/iu }).click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: /^Şifreyi gizle$/iu }).click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "password");
  await page.screenshot({ path: "generated-artifacts/partner-login-mobile.jpg", fullPage: true });
  await page.getByRole("button", { name: /^İlk kez giriş yapıyorum$/iu }).click();
  await page.getByLabel(/HANK kodu/iu).fill(code);
  await page.getByRole("button", { name: /^Devam et$/iu }).click();
  await expect(page.getByLabel(/Referans kodu/iu)).toBeVisible();
  await expect(page.getByLabel(/^Kullanıcı adı$/iu)).toHaveCount(0);
  await page.getByLabel(/Referans kodu/iu).fill("wrong");
  await page.getByRole("button", { name: /Referansı|Doğrula|Devam et/ }).click();
  await expect(page.getByRole("alert")).toContainText("Referans kodu geçersiz");
  await page.getByLabel(/Referans kodu/iu).fill("HANKS");
  await page.getByRole("button", { name: /Referansı|Doğrula|Devam et/ }).click();
  await expect(page.getByLabel(/Referans kodu/iu)).toHaveCount(0);
  await page.getByLabel(/^Kullanıcı adı$/iu).fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^Hesabı oluştur$/iu }).click();
  await expect(page.getByRole("heading", { name: "Genel Bakış", exact: true })).toBeVisible();
  const menuTrigger = page.getByRole("button", { name: "Partner Menüsünü Aç", exact: true });
  await expect(menuTrigger).toBeVisible();
  const triggerBox = await menuTrigger.boundingBox();
  expect(Math.round(triggerBox!.width * 100) / 100).toBeGreaterThanOrEqual(44);
  expect(Math.round(triggerBox!.height * 100) / 100).toBeGreaterThanOrEqual(44);
  const unlockedOverflow = await page.evaluate(() => getComputedStyle(document.body).overflowY);
  await menuTrigger.click();
  const mobileMenu = page.getByRole("dialog", { name: "Partner Menüsü", exact: true });
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole("img", { name: "HANK", exact: true })).toBeVisible();
  await expect(mobileMenu).toHaveCSS("font-family", /Inter/);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe("hidden");
  for (const label of ["Genel Bakış", "Satışlarım", "Çekim Taleplerim", "Hesabım"]) {
    expect((await mobileMenu.getByRole("button", { name: label, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press("Tab");
  expect(await mobileMenu.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.screenshot({ path: "generated-artifacts/partner-mobile-menu.jpg" });
  await page.keyboard.press("Escape");
  await expect(mobileMenu).toBeHidden();
  await expect(menuTrigger).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe(unlockedOverflow);
  await menuTrigger.click();
  const drawerBox = await mobileMenu.boundingBox();
  if (drawerBox!.x + drawerBox!.width < 401) await page.mouse.click(401, 450);
  else if (drawerBox!.x > 1) await page.mouse.click(1, 450);
  else await mobileMenu.getByRole("button", { name: /Menüyü Kapat/iu }).click();
  await expect(mobileMenu).toBeHidden();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: /^Partner kodunu kopyala$/iu }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  await expect(page.getByText(/HANK Test Forma/).first()).toBeVisible();
  await assertFits();
  await page.screenshot({ path: "generated-artifacts/partner-mobile.jpg", fullPage: true });
  await openSection("Satışlarım");
  await expect(page.getByRole("heading", { name: "Satışlarım", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Satışlarım", exact: true })).toHaveCSS("font-family", /Inter/);
  const productPhoto = page.getByRole("img", { name: "HANK Test Forma", exact: true });
  await expect(productPhoto).toBeVisible();
  await expect(productPhoto).toHaveAttribute("src", "/uploads/branding/hank-logo.svg");
  await expect.poll(() => productPhoto.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.getByText("Görsel Yok", { exact: true })).toHaveCount(2);
  await page.screenshot({ path: "generated-artifacts/partner-sales-mobile.jpg", fullPage: true });
  await expect(page.getByText(/Deneme G\. M\./).first()).toBeVisible();
  await expect(page.getByText("Gizli Müşteri", { exact: true })).toHaveCount(0);
  await assertFits();
  await openSection("Çekim Taleplerim");
  await page.getByLabel(/Talep tutarı/iu).fill("10,50");
  await page.getByRole("textbox", { name: /^Not\s/iu }).fill(`Mobil Görünüm Kontrolü ${"UzunNot".repeat(20)}`);
  await page.getByRole("button", { name: /^(Ödeme|Çekim) talebi oluştur$/iu }).click();
  await expect(page.getByRole("status").filter({ hasText: /talebin alındı/ })).toBeVisible();
  await expect(page.getByText("İncelemede", { exact: true })).toBeVisible();
  await openSection("Satışlarım");
  await page.getByLabel(/Başlangıç tarihi/iu).fill("2099-01-01");
  await expect(page.getByText("Bu tarih aralığında satış görünmüyor.", { exact: true })).toBeVisible();
  await page.getByLabel(/Başlangıç tarihi/iu).fill("");
  await expect(page.getByText(/HANK Test Forma/).first()).toBeVisible();
  await openSection("Hesabım");
  const updatedPassword = `Test-${randomUUID()}`;
  await page.getByLabel(/^Mevcut şifre$/iu).fill(password);
  await page.getByLabel(/^Yeni şifre$/iu).fill(updatedPassword);
  await page.getByRole("button", { name: /^Şifreyi güncelle$/iu }).click();
  await expect(page.getByRole("status").filter({ hasText: /Şifren güncellendi/ })).toBeVisible();
  await openSection("Genel Bakış");
  for (const [width, height] of [[320, 568], [375, 812], [390, 844], [430, 932], [768, 1024], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const section of ["Genel Bakış", "Satışlarım", "Çekim Taleplerim", "Hesabım"]) {
      await openSection(section);
      await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
      await assertFits();
      if (section === "Genel Bakış" && [320, 390, 768].includes(width)) {
        await page.screenshot({ path: `generated-artifacts/partner-mobile-${width}.jpg`, fullPage: true });
      }
    }
  }
  // An open mobile menu must not leave an overlay or scroll lock at desktop widths.
  await menuTrigger.click();
  await expect(mobileMenu).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(mobileMenu).toBeHidden();
  await expect(menuTrigger).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe(unlockedOverflow);
  await openSection("Genel Bakış");
  await assertFits();
  await page.screenshot({ path: "generated-artifacts/partner-desktop.jpg", fullPage: true });
  await openSection("Satışlarım");
  await expect(page.getByRole("img", { name: "HANK Test Forma", exact: true })).toBeVisible();
  await page.screenshot({ path: "generated-artifacts/partner-sales-desktop.jpg", fullPage: true });
  await page.getByRole("button", { name: /^Çıkış yap$/iu }).filter({ visible: true }).first().click();
  await page.getByLabel(/Kullanıcı adı veya kod/iu).fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: /^Giriş yap$/iu }).click();
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
  await expect(page.getByLabel(/Kullanıcı adı veya kod/iu)).toBeVisible();
  await page.getByLabel(/Kullanıcı adı veya kod/iu).fill(username);
  await page.getByLabel("Şifre", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: /^Giriş yap$/iu }).click();
  await expect(page.getByRole("alert")).toContainText("hatalı");
  expect(pageErrors).toEqual([]);
  console.log("PASS: real browser login/onboarding, mobile drawer focus/escape/overlay/section/desktop-resize behavior, all sections at 320/375/390/430/768/landscape, Inter font, product photos and fallbacks, masked sales, withdrawal, date filter, password update/relogin, admin payment and reset.");
} finally {
  await browser.close();
  if (orderId) await db.execute(sql`DELETE FROM orders WHERE id=${orderId}`);
  if (couponId) await db.execute(sql`DELETE FROM coupons WHERE id=${couponId}`);
  for (const id of productIds) await db.execute(sql`DELETE FROM products WHERE id=${id}`);
  if (adminId) {
    await db.execute(sql`DELETE FROM refresh_tokens WHERE admin_user_id=${adminId}`);
    await db.execute(sql`DELETE FROM admin_users WHERE id=${adminId}`);
  }
}
