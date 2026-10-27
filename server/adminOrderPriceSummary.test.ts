import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OrderPriceSummary from "../client/src/components/admin/OrderPriceSummary";

const base = { subtotal: "1000", shippingCost: "50", total: "770" };
const render = (fields = {}) => renderToStaticMarkup(
  React.createElement(OrderPriceSummary, { order: { ...base, ...fields } }),
);

test("admin order summary displays saved campaign and coupon discounts independently", () => {
  const html = render({
    campaignDiscountAmount: "200",
    campaignDiscountDetails: { campaignName: "Sepette %20" },
    discountAmount: "80",
    couponCode: "SPORCU",
  });
  assert.match(html, /Sepet indirimi \(Sepette %20\)/);
  assert.match(html, /-200\.00₺/);
  assert.match(html, /Kupon indirimi \(SPORCU\)/);
  assert.match(html, /-80\.00₺/);
  assert.match(html, />770\.00₺</);
});

test("campaign-only orders work even without campaign details or a live campaign", () => {
  const html = render({ campaignDiscountAmount: "200", campaignDiscountDetails: null });
  assert.match(html, /Sepet indirimi/);
  assert.match(html, /-200\.00₺/);
  assert.doesNotMatch(html, /Kupon indirimi/);
  assert.match(html, />770\.00₺</);
});

test("coupon-only and legacy orders do not invent campaign discounts", () => {
  const coupon = render({ discountAmount: "100", couponCode: "KOD" });
  assert.match(coupon, /Kupon indirimi \(KOD\)/);
  assert.doesNotMatch(coupon, /Sepet indirimi/);
  for (const fields of [{}, { campaignDiscountAmount: "0", discountAmount: "0" }]) {
    const html = render(fields);
    assert.doesNotMatch(html, /Sepet indirimi|Kupon indirimi/);
    assert.match(html, />770\.00₺</);
  }
});

test("campaign labels are escaped and discount rows preserve wrapping and fixed amount space", () => {
  const html = render({
    campaignDiscountAmount: "200",
    campaignDiscountDetails: { campaignName: "<script>long-campaign-name</script>" },
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /min-w-0 break-words/);
  assert.match(html, /shrink-0 whitespace-nowrap/);
});
