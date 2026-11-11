import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { reserveWithdrawal } from "../server/partnerFinance";

if (!process.env.REPLIT_DEV_DOMAIN) throw new Error("Development preview domain required");
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const code = `TABUSER${suffix}`.toUpperCase();
const newCode = `TABNEW${suffix}`.toUpperCase();
const adminUsername = `tabs_admin_${suffix}`;
const password = `Test-${randomUUID()}`;
const couponIds: string[] = [];
let adminId = "";
const browser = await chromium.launch({
  headless: true, args: ["--no-sandbox"],
  ...(existsSync("/repl/tools/bin/chromium") ? { executablePath: "/repl/tools/bin/chromium" } : {}),
});
try {
  for (const fixtureCode of [code, newCode]) {
    const result = await db.execute(sql`
      INSERT INTO coupons(code,discount_type,discount_value,is_influencer_code,influencer_name,commission_type,commission_value,total_commission_earned)
      VALUES(${fixtureCode},'percentage',10,true,'Sekme Görünümü Deneme Partneri','percentage',5,100)
      RETURNING id
    `);
    couponIds.push(String(result.rows[0].id));
  }
  const hash = await bcrypt.hash(password, 10);
  await db.execute(sql`
    INSERT INTO partner_accounts(coupon_id,username,password_hash)
    VALUES(${couponIds[0]},${`tabs_partner_${suffix}`},${hash})
  `);
  await reserveWithdrawal(couponIds[0], "10", "Ödenecek Deneme Talebi");
  await reserveWithdrawal(couponIds[0], "20", "Reddedilecek Deneme Talebi");
  adminId = String((await db.execute(sql`
    INSERT INTO admin_users(username,password) VALUES(${adminUsername},${hash}) RETURNING id
  `)).rows[0].id);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "#replit-dev-banner {display:none!important}";
      document.head.append(style);
    });
  });
  await page.goto(`${origin}/toov-admin/login`);
  await page.locator("#username").fill(adminUsername);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /GİRİŞ YAP|Giriş Yap|Giriş yap/ }).click();
  await page.waitForURL(url => url.pathname === "/toov-admin");
  await page.goto(`${origin}/toov-admin?tab=influencers`);
  const tab = (name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`, "u") });
  const panel = page.getByRole("tabpanel");
  await expect(tab("Genel")).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("heading", { name: "Influencer Listesi", exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: /^Şifreyi Sıfırla$/iu })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: /^Manuel Ödendi$/iu })).toHaveCount(0);
  await page.screenshot({ path: "generated-artifacts/influencer-general-desktop.jpg" });
  await tab("Partner Panel").click();
  const account = panel.locator("article").filter({ has: page.getByText(code, { exact: true }) });
  await expect(account).toBeVisible();
  await expect(panel.getByText(newCode, { exact: true })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Influencer Listesi", exact: true })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: /^Manuel Ödendi$/iu })).toHaveCount(0);
  await account.getByRole("button", { name: /^Erişimi Kapat$/iu }).click();
  await expect(account.getByRole("button", { name: /^Erişimi Aç$/iu })).toBeVisible();
  await account.getByRole("button", { name: /^Erişimi Aç$/iu }).click();
  await expect(account.getByRole("button", { name: /^Erişimi Kapat$/iu })).toBeVisible();
  await account.getByRole("button", { name: /^Şifreyi Sıfırla$/iu }).click();
  await expect.poll(async () => (await db.execute(sql`
    SELECT password_hash FROM partner_accounts WHERE coupon_id=${couponIds[0]}
  `)).rows[0].password_hash).toBeNull();
  await page.screenshot({ path: "generated-artifacts/influencer-partners-desktop.jpg" });
  await tab("Ödeme Talepleri").click();
  await expect(panel.getByText(code, { exact: true }).first()).toBeVisible();
  await expect(panel.getByRole("button", { name: /^Şifreyi Sıfırla$/iu })).toHaveCount(0);
  await page.screenshot({ path: "generated-artifacts/influencer-payments-desktop.jpg" });
  const paid = panel.locator("article").filter({ hasText: "Ödenecek Deneme Talebi" });
  await paid.getByRole("button", { name: /^Manuel Ödendi$/iu }).click();
  await expect(paid.getByText("Ödendi", { exact: true })).toBeVisible();
  const rejected = panel.locator("article").filter({ hasText: "Reddedilecek Deneme Talebi" });
  await rejected.getByRole("button", { name: /^Reddet$/iu }).click();
  await expect(rejected.getByText("Reddedildi", { exact: true })).toBeVisible();
  await expect.poll(async () => Number((await db.execute(sql`
    SELECT total_commission_earned FROM coupons WHERE id=${couponIds[0]}
  `)).rows[0].total_commission_earned)).toBe(90);
  // Exercise real tab navigation and content at narrow widths, not just a screenshot.
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Genel", "Partner Panel", "Ödeme Talepleri"]) {
      await tab(name).click();
      await expect(tab(name)).toHaveAttribute("aria-selected", "true");
      await expect(panel).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({
        path: `generated-artifacts/influencer-${name === "Genel" ? "general" : name === "Partner Panel" ? "partners" : "payments"}-mobile.jpg`,
      });
    }
  }
  await tab("Genel").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab("Partner Panel")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tab("Partner Panel")).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
  console.log("PASS: authenticated admin tabs, isolated content, registered/unregistered accounts, access toggles, password reset, manual payout/rejection with balances, keyboard and 320/390/768px layouts.");
} finally {
  await browser.close();
  for (const id of couponIds) await db.execute(sql`DELETE FROM coupons WHERE id=${id}`);
  if (adminId) {
    await db.execute(sql`DELETE FROM refresh_tokens WHERE admin_user_id=${adminId}`);
    await db.execute(sql`DELETE FROM admin_users WHERE id=${adminId}`);
  }
}
