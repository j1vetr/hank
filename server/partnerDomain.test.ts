import test from "node:test";
import assert from "node:assert/strict";
import { commissionFor, eligibleOrder, maskedName, moneyCents, moneySchema, passwordSchema, usernameSchema } from "./partnerDomain";

test("partner commissions retain existing paid-total basis and round to cents", () => {
  assert.equal(commissionFor("999.99", "percentage", "5"), "50.00");
  assert.equal(commissionFor("1000", "per_use", "30"), "30.00");
  assert.equal(commissionFor("1000", "fixed_total", "30"), "0.00");
  assert.equal(commissionFor("1000", null, null), "0.00");
  assert.equal(moneyCents("1.23"), 123);
});
test("only paid noncancelled orders count in partner statistics", () => {
  for (const status of ["cancelled", "refunded", "returned"]) {
    assert.equal(eligibleOrder({ status, payment_status: "paid" }), false);
  }
  assert.equal(eligibleOrder({ status: "processing", payment_status: "pending" }), false);
  assert.equal(eligibleOrder({ status: "delivered", payment_status: "paid" }), true);
});
test("partner inputs reject unsafe usernames, bcrypt truncation and invalid withdrawal amounts", () => {
  assert.equal(usernameSchema.parse(" Tolga.10 "), "tolga.10");
  for (const value of ["aa", "x@y", "<script>", "a".repeat(33)]) assert.equal(usernameSchema.safeParse(value).success, false);
  assert.equal(passwordSchema.safeParse("g".repeat(8)).success, true);
  assert.equal(passwordSchema.safeParse("ğ".repeat(37)).success, false);
  assert.equal(passwordSchema.safeParse("short").success, false);
  for (const value of ["0", "-5", "1.001", "NaN", "Infinity", "1e3", "1,5", "100000000"]) {
    assert.equal(moneySchema.safeParse(value).success, false, value);
  }
  assert.equal(moneySchema.safeParse("10.50").success, true);
});
test("partner customer names expose only first name and surname initials", () => {
  assert.equal(maskedName("  Test Örnek Müşteri  "), "Test Ö. M.");
  assert.equal(maskedName("Test"), "Test");
  assert.equal(maskedName(""), "Müşteri");
});
