import test from "node:test";
import assert from "node:assert/strict";
import {
  isNovemberCampaignWindow, isNovemberShoppingRoute, NOVEMBER_HEADLINE, NOVEMBER_OFFER,
} from "../shared/novemberPromotion";


test("November promotion uses Istanbul month boundaries and ends automatically", () => {
  assert.equal(isNovemberCampaignWindow(new Date("2026-10-31T20:59:59Z")), false);
  assert.equal(isNovemberCampaignWindow(new Date("2026-10-31T21:00:00Z")), true);
  assert.equal(isNovemberCampaignWindow(new Date("2026-11-30T20:59:59Z")), true);
  assert.equal(isNovemberCampaignWindow(new Date("2026-11-30T21:00:00Z")), false);
  assert.equal(isNovemberCampaignWindow(new Date("2027-11-10T12:00:00Z")), false);
});

test("November uses the merchant's exact artwork copy without reinterpreting discounts", () => {
  assert.equal(NOVEMBER_HEADLINE, "KASIM AYI İNDİRİMLERİ BAŞLADI %30 İNDİRİM!");
  assert.equal(NOVEMBER_OFFER, "(%20 SEPETTE + %10 SPORCU KODU)");
});

test("entry popup is confined to shopping entry routes", () => {
  for (const path of ["/", "/magaza", "/kategori/tshirt", "/urun/forma"]) {
    assert.equal(isNovemberShoppingRoute(path), true);
  }
  for (const path of ["/partner", "/toov-admin", "/toov-admin/orders/test", "/sepet", "/odeme", "/odeme-basarili", "/hesabim", "/giris"]) {
    assert.equal(isNovemberShoppingRoute(path), false);
  }
});
