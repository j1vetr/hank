import { chromium, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { NOVEMBER_SESSION_KEY } from "../shared/novemberPromotion";

if (!process.env.REPLIT_DEV_DOMAIN) throw new Error("Development preview domain required");
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const browser = await chromium.launch({
  headless: true, args: ["--no-sandbox"],
  ...(existsSync("/repl/tools/bin/chromium") ? { executablePath: "/repl/tools/bin/chromium" } : {}),
});
const active = {
  id: "browser-november-test", name: "Sepette %20", campaignType: "direct",
  discountType: "percentage", discountPercentage: 20, eligibleProductIds: ["eligible"],
};
async function setup(campaign: unknown, width = 402, height = 874, brokenImage = false) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-11-10T10:00:00Z"));
  const errors: string[] = [], posters: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (request.url().includes("/uploads/promo/november-2026")) posters.push(request.url());
  });
  // Public API fixtures only, no campaign/database mutation or checkout requests.
  await page.route("**/api/campaigns/active", route => route.fulfill({ json: campaign }));
  if (brokenImage) await page.route("**/uploads/promo/november-2026-*.webp", route => route.abort());
  return { context, page, errors, posters };
}
try {
  for (const [width, height] of [[402, 874], [1440, 900], [320, 568]]) {
    const { page, context, errors, posters } = await setup(active, width, height);
    await page.goto(origin);
    const dialog = page.getByTestId("dialog-november-promo");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    // Only remove the development hosting notice from this test browser.
    await page.addStyleTag({ content: "#replit-dev-banner { display: none !important; }" });
    const rect = await dialog.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByTestId("bar-november-promo")).toBeVisible();
    await expect(page.getByTestId("bar-november-promo")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(page.getByTestId("bar-november-promo")).toHaveCSS("background-color", "rgb(213, 45, 37)");
    await expect(page.getByTestId("button-november-discover")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.getByTestId("button-november-discover")).toHaveCSS("color", "rgb(0, 0, 0)");
    const headline = page.getByTestId("link-november-promo").locator("span").first();
    await expect(headline).toHaveCSS("font-family", /Bebas Neue/);
    const headlineRect = await headline.boundingBox();
    expect(headlineRect!.x).toBeGreaterThanOrEqual(0);
    expect(headlineRect!.x + headlineRect!.width).toBeLessThanOrEqual(width);
    await expect(dialog.getByRole("img")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Kampanya penceresini kapat" })).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: `generated-artifacts/november-popup-${width}.jpg` });
    expect(posters.length).toBeGreaterThan(0);
    expect(posters.every(url => url.endsWith(".webp"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(key => sessionStorage.getItem(key), NOVEMBER_SESSION_KEY)).toBe("1");
    const loaded = posters.length;
    await page.getByTestId("link-november-promo").click({ timeout: 5000 });
    await page.waitForURL("**/magaza");
    await page.waitForTimeout(2200);
    await expect(dialog).toHaveCount(0);
    expect(posters.length).toBe(loaded);
    expect(errors).toEqual([]);
    await context.close();
  }
  for (const campaign of [null, { ...active, discountPercentage: 15 }]) {
    const { page, context, posters, errors } = await setup(campaign);
    await page.goto(origin);
    await page.waitForTimeout(2300);
    await expect(page.getByTestId("bar-november-promo")).toBeVisible();
    await expect(page.getByTestId("dialog-november-promo")).toBeVisible({ timeout: 10000 });
    expect(posters.length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    await context.close();
  }
  const excluded = await setup(active);
  await excluded.page.goto(`${origin}/partner`);
  await excluded.page.waitForTimeout(2300);
  expect(excluded.posters).toEqual([]);
  await expect(excluded.page.getByTestId("dialog-november-promo")).toHaveCount(0);
  await excluded.context.close();
  const broken = await setup(active, 402, 874, true);
  await broken.page.goto(origin);
  await broken.page.waitForTimeout(2800);
  await expect(broken.page.getByTestId("dialog-november-promo")).toHaveCount(0);
  expect(broken.errors).toEqual([]);
  await broken.context.close();
  console.log("PASS: 320px/402px/1440px layout, original artwork, focus trap, Escape, session-once dismissal, no repeat downloads, marketing independent of discount configuration, partner exclusion and broken image.");
} finally {
  await browser.close();
}
