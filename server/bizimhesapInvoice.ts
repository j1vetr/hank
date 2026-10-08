import type { Order, OrderItem } from "@shared/schema";

function cents(value: string | number | null | undefined): number {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new Error("Fatura tutarı geçersiz.");
  const result = Math.round((number + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(result)) throw new Error("Fatura tutarı geçersiz.");
  return result;
}

const money = (value: number) => (value / 100).toFixed(2);

/** Allocate exact cents with largest remainders, never exceeding line capacity. */
function allocate(amount: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (amount > sum || amount < 0) throw new Error("İndirim ürün tutarını aşıyor.");
  if (!amount) return weights.map(() => 0);
  const raw = weights.map(weight => amount * weight / sum);
  const results = raw.map(Math.floor);
  let remaining = amount - results.reduce((a, b) => a + b, 0);
  const indices = raw.map((value, index) => ({ index, fraction: value - results[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of indices) {
    if (remaining && results[index] < weights[index]) {
      results[index]++;
      remaining--;
    }
  }
  if (remaining) throw new Error("İndirim dağılımı hesaplanamadı.");
  return results;
}

export function buildBizimHesapInvoice(
  order: Order,
  items: OrderItem[],
  itemSkus: Map<string, string> = new Map(),
  firmId = "",
  now = new Date(),
) {
  if (!items.length) throw new Error("Fatura için sipariş kalemi bulunamadı.");
  const units = items.flatMap((item, index) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10000) {
      throw new Error("Fatura ürün adedi geçersiz.");
    }
    const price = cents(item.price);
    if (price * item.quantity !== cents(item.subtotal)) {
      throw new Error("Sipariş kaleminin fiyatı ve ara toplamı uyuşmuyor.");
    }
    return Array.from({ length: item.quantity }, () => ({
      index, original: price, campaign: 0, coupon: 0, campaignSelected: false,
    }));
  });
  const campaignAmount = cents(order.campaignDiscountAmount);
  const snapshots = order.campaignDiscountDetails?.discountedItems || [];
  if (campaignAmount) {
    if (snapshots.reduce((sum, snapshot) => sum + cents(snapshot.discountAmount), 0) !== campaignAmount) {
      throw new Error("Kampanya indirimi detayları toplamla uyuşmuyor. Fatura gönderilmedi.");
    }
    for (const snapshot of snapshots) {
      if (!Number.isSafeInteger(snapshot.quantity) || snapshot.quantity <= 0) {
        throw new Error("Kampanya ürün adedi geçersiz.");
      }
      const selected = units.filter(unit => !unit.campaignSelected &&
        items[unit.index].productId === snapshot.productId &&
        (!snapshot.variantId || items[unit.index].variantId === snapshot.variantId))
        .sort((a, b) => a.original - b.original || a.index - b.index)
        .slice(0, snapshot.quantity);
      if (selected.length !== snapshot.quantity) {
        throw new Error("Kampanya indirimi sipariş kalemleriyle eşleştirilemedi.");
      }
      const discounts = allocate(cents(snapshot.discountAmount), selected.map(unit => unit.original));
      selected.forEach((unit, index) => {
        unit.campaign = discounts[index];
        unit.campaignSelected = true;
      });
    }
  }
  const productAfterCampaign = units.reduce((sum, unit) => sum + unit.original - unit.campaign, 0);
  const shipping = cents(order.shippingCost);
  const coupon = cents(order.discountAmount);
  if (coupon > productAfterCampaign + shipping) throw new Error("Kupon indirimi sipariş tutarını aşıyor.");
  const productCoupon = Math.min(coupon, productAfterCampaign);
  allocate(productCoupon, units.map(unit => unit.original - unit.campaign))
    .forEach((amount, index) => { units[index].coupon = amount; });
  const shippingCoupon = coupon - productCoupon;
  const expectedTotal = productAfterCampaign + shipping - coupon;
  if (expectedTotal !== cents(order.total)) {
    throw new Error("Fatura toplamı müşterinin ödediği sipariş toplamıyla uyuşmuyor. Fatura gönderilmedi.");
  }

  const country = order.shippingAddress.country;
  const domestic = !country || country === "Türkiye" || country === "Turkey";
  function detail(original: number, final: number, taxRate: number, quantity: number) {
    const gross = Math.round(original / (1 + taxRate / 100));
    const net = Math.round(final / (1 + taxRate / 100));
    return {
      taxRate: taxRate.toFixed(2), quantity,
      unitPrice: (gross / 100 / quantity).toFixed(6),
      grossPrice: money(gross), discount: money(gross - net),
      net: money(net), tax: money(final - net), total: money(final),
    };
  }
  const details = items.map((item, index) => {
    const itemUnits = units.filter(unit => unit.index === index);
    const original = itemUnits.reduce((sum, unit) => sum + unit.original, 0);
    const campaign = itemUnits.reduce((sum, unit) => sum + unit.campaign, 0);
    const coupon = itemUnits.reduce((sum, unit) => sum + unit.coupon, 0);
    const notes: string[] = [];
    if (campaign) notes.push(`Kampanya indirimi: ${money(campaign)} TL`);
    if (coupon) notes.push(`Kupon indirimi: ${money(coupon)} TL`);
    return {
      productId: itemSkus.get(item.id) || `HANK-${order.orderNumber}-${index + 1}`,
      productName: `${item.productName || "Ürün"}${item.variantDetails ? ` - ${item.variantDetails}` : ""}`,
      note: notes.join(". "), barcode: "",
      ...detail(original, original - campaign - coupon, domestic ? 10 : 0, item.quantity),
    };
  });
  if (shipping) {
    details.push({
      productId: "KARGO", productName: "Kargo Ücreti",
      note: shippingCoupon ? `Kupon indirimi: ${money(shippingCoupon)} TL` : "", barcode: "",
      ...detail(shipping, shipping - shippingCoupon, domestic ? 20 : 0, 1),
    });
  }
  const sum = (key: "grossPrice" | "discount" | "net" | "tax" | "total") =>
    details.reduce((total, line) => total + cents(line[key]), 0);
  if (sum("total") !== expectedTotal || sum("net") + sum("tax") !== expectedTotal) {
    throw new Error("Fatura satır toplamları doğrulanamadı.");
  }
  const invoiceDate = now.toISOString();
  return {
    firmId, invoiceNo: order.orderNumber, invoiceType: 3,
    note: `HANK Online Sipariş - ${order.orderNumber}`,
    dates: { invoiceDate, dueDate: invoiceDate, deliveryDate: invoiceDate },
    customer: {
      customerId: order.customerEmail, title: order.customerName, taxOffice: "", taxNo: "",
      email: order.customerEmail, phone: order.customerPhone || "",
      address: `${order.shippingAddress.address}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`,
    },
    amounts: {
      currency: "TL", gross: money(sum("grossPrice")), discount: money(sum("discount")),
      net: money(sum("net")), tax: money(sum("tax")), total: money(expectedTotal),
    },
    details,
  };
}
