import type { Coupon, InsertOrder, PendingPayment } from "@shared/schema";
import type { CartCampaignPricing } from "./cartCampaign";

const FREE_SHIPPING_THRESHOLD = 2500;
const DOMESTIC_SHIPPING_COST = 200;
const INTERNATIONAL_SHIPPING_COST = 2500;
const IRAQ_SHIPPING_COST = 5700;
const GREECE_SHIPPING_COST = 3000;

type PricingCoupon = Pick<
  Coupon,
  "discountType" | "discountValue" | "maxDiscountAmount" | "freeShipping" | "appliesToShipping"
>;

export type PayTRBasket = Array<[string, string, number]>;

export type CheckoutPricing = {
  shippingCost: number;
  discountAmount: number;
  paymentAmount: number;
  total: number;
  basket: PayTRBasket;
};

type BasketUnit = {
  name: string;
  priceCents: number;
  isProduct: boolean;
};

const moneyToCents = (value: number) => Math.round((value + Number.EPSILON) * 100);

function calculateCouponDiscount(amount: number, coupon: PricingCoupon | null) {
  if (!coupon) return 0;

  const rawDiscount = coupon.discountType === "percentage"
    ? (amount * parseFloat(coupon.discountValue)) / 100
    : parseFloat(coupon.discountValue);
  const cappedDiscount = coupon.maxDiscountAmount
    ? Math.min(rawDiscount, parseFloat(coupon.maxDiscountAmount))
    : rawDiscount;

  return Math.max(0, Math.min(cappedDiscount, amount));
}

function getShippingCost(country: string, subtotal: number) {
  if (country === "Türkiye") {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DOMESTIC_SHIPPING_COST;
  }
  if (country === "Irak") return IRAQ_SHIPPING_COST;
  if (country === "Yunanistan") return GREECE_SHIPPING_COST;
  return INTERNATIONAL_SHIPPING_COST;
}

function createBasketUnits(pricing: CartCampaignPricing, shippingCost: number): BasketUnit[] {
  const units: BasketUnit[] = [];

  for (const line of pricing.lines) {
    for (let unit = 0; unit < line.quantity - line.discountedQuantity; unit += 1) {
      units.push({
        name: line.productName.substring(0, 50),
        priceCents: moneyToCents(line.unitPrice),
        isProduct: true,
      });
    }
    for (let unit = 0; unit < line.discountedQuantity; unit += 1) {
      units.push({
        name: `${line.productName.substring(0, 42)} (kampanya)`,
        priceCents: moneyToCents(line.discountedUnitPrice),
        isProduct: true,
      });
    }
  }

  if (shippingCost > 0) {
    units.push({ name: "Kargo", priceCents: moneyToCents(shippingCost), isProduct: false });
  }

  return units;
}

function groupBasketUnits(units: BasketUnit[]): PayTRBasket {
  const groups = new Map<string, { name: string; priceCents: number; quantity: number }>();
  for (const unit of units) {
    const key = `${unit.name}|${unit.priceCents}`;
    const group = groups.get(key) || { name: unit.name, priceCents: unit.priceCents, quantity: 0 };
    group.quantity += 1;
    groups.set(key, group);
  }

  return Array.from(groups.values()).map(group => [
    group.name,
    group.priceCents.toString(),
    group.quantity,
  ]);
}

export function calculateCheckoutPricing(
  campaignPricing: CartCampaignPricing,
  coupon: PricingCoupon | null = null,
  country = "Türkiye",
): CheckoutPricing {
  let shippingCost = getShippingCost(country, campaignPricing.subtotal);
  if (coupon?.freeShipping) shippingCost = 0;

  let discountAmount = calculateCouponDiscount(campaignPricing.discountedSubtotal, coupon);
  if (coupon?.appliesToShipping && shippingCost > 0) {
    discountAmount = calculateCouponDiscount(campaignPricing.discountedSubtotal + shippingCost, coupon);
  }

  const discountedSubtotalCents = moneyToCents(campaignPricing.discountedSubtotal);
  const shippingCents = moneyToCents(shippingCost);
  const discountCents = Math.min(
    moneyToCents(discountAmount),
    discountedSubtotalCents + shippingCents,
  );
  const paymentAmount = Math.max(0, discountedSubtotalCents - discountCents + shippingCents);
  const units = createBasketUnits(campaignPricing, shippingCost);
  let remainingDiscountCents = discountCents;
  const discountableUnits = units.filter(unit => unit.isProduct || coupon?.appliesToShipping);

  for (const unit of [...discountableUnits].sort((a, b) => b.priceCents - a.priceCents)) {
    const unitDiscount = Math.min(unit.priceCents, remainingDiscountCents);
    unit.priceCents -= unitDiscount;
    remainingDiscountCents -= unitDiscount;
    if (remainingDiscountCents === 0) break;
  }

  if (remainingDiscountCents > 0) {
    throw new Error("Kupon indirimi sepet tutarını aşıyor");
  }

  const basketTotal = units.reduce((total, unit) => total + unit.priceCents, 0);
  if (basketTotal !== paymentAmount) {
    throw new Error("PayTR sepet tutarı ödeme tutarıyla eşleşmiyor");
  }

  return {
    shippingCost,
    discountAmount: discountCents / 100,
    paymentAmount,
    total: paymentAmount / 100,
    basket: groupBasketUnits(units),
  };
}

export type CampaignPersistenceFields = {
  campaignId: NonNullable<InsertOrder["campaignId"]> | null;
  campaignDiscountAmount: string;
  campaignDiscountDetails: CartCampaignPricing["campaignDiscountDetails"];
};

export function campaignFieldsFromPricing(
  pricing: Pick<CartCampaignPricing, "campaign" | "campaignDiscount" | "campaignDiscountDetails">,
): CampaignPersistenceFields {
  return {
    campaignId: pricing.campaign?.id || null,
    campaignDiscountAmount: pricing.campaignDiscount.toFixed(2),
    campaignDiscountDetails: pricing.campaignDiscountDetails,
  };
}

export function campaignFieldsFromPendingPayment(
  payment: Pick<PendingPayment, "campaignId" | "campaignDiscountAmount" | "campaignDiscountDetails">,
): CampaignPersistenceFields {
  return {
    campaignId: payment.campaignId ?? null,
    campaignDiscountAmount: payment.campaignDiscountAmount || "0",
    campaignDiscountDetails: payment.campaignDiscountDetails ?? null,
  };
}