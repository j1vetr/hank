import type { Order, OrderItem } from "@shared/schema";

const BIZIMHESAP_API_URL = "https://bizimhesap.com/api/b2b/addinvoice";
const FIRM_ID = process.env.BIZIMHESAP_FIRM_ID || "";

interface BizimHesapInvoiceResponse {
  error: string;
  guid: string;
  url: string;
}

interface InvoiceDetail {
  productId: string;
  productName: string;
  note: string;
  barcode: string;
  taxRate: string;
  quantity: number;
  unitPrice: string;
  grossPrice: string;
  discount: string;
  net: string;
  tax: string;
  total: string;
}

export async function sendInvoiceToBizimHesap(
  order: Order,
  orderItems: OrderItem[]
): Promise<{ success: boolean; guid?: string; url?: string; error?: string }> {
  if (!FIRM_ID) {
    console.error("[BizimHesap] BIZIMHESAP_FIRM_ID is not configured");
    return { success: false, error: "BizimHesap yapılandırması eksik" };
  }

  try {
    const shippingAddress = order.shippingAddress as {
      address: string;
      city: string;
      district: string;
      postalCode?: string;
    };

    const invoiceDate = new Date().toISOString();
    const KDV_RATE = 20;

    // Calculate original subtotal (sum of item subtotals)
    const originalSubtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    
    // Get discount from order and calculate discount ratio
    const discountAmount = parseFloat(order.discountAmount || '0');
    const discountRatio = originalSubtotal > 0 ? discountAmount / originalSubtotal : 0;

    const details: InvoiceDetail[] = orderItems.map((item, index) => {
      // Apply proportional discount to each item
      const originalItemTotal = parseFloat(item.subtotal);
      const itemDiscount = originalItemTotal * discountRatio;
      const discountedItemTotal = originalItemTotal - itemDiscount;
      
      const netAmount = discountedItemTotal / (1 + KDV_RATE / 100);
      const taxAmount = discountedItemTotal - netAmount;

      // Build product name with variant details
      let fullProductName = item.productName || "Ürün";
      if (item.variantDetails) {
        fullProductName += ` - ${item.variantDetails}`;
      }

      return {
        productId: item.productId ? item.productId.substring(0, 20) : `ITEM-${Date.now()}-${index}`,
        productName: fullProductName,
        note: "",
        barcode: "",
        taxRate: `${KDV_RATE}.00`,
        quantity: item.quantity,
        unitPrice: (netAmount / item.quantity).toFixed(2),
        grossPrice: netAmount.toFixed(2),
        discount: "0.00",
        net: netAmount.toFixed(2),
        tax: taxAmount.toFixed(2),
        total: discountedItemTotal.toFixed(2),
      };
    });

    // Add shipping cost as separate line item if applicable
    const shippingCost = parseFloat(order.shippingCost || "0");
    if (shippingCost > 0) {
      const shippingNet = shippingCost / (1 + KDV_RATE / 100);
      const shippingTax = shippingCost - shippingNet;

      details.push({
        productId: "KARGO",
        productName: "Kargo Ücreti",
        note: "",
        barcode: "",
        taxRate: `${KDV_RATE}.00`,
        quantity: 1,
        unitPrice: shippingNet.toFixed(2),
        grossPrice: shippingNet.toFixed(2),
        discount: "0.00",
        net: shippingNet.toFixed(2),
        tax: shippingTax.toFixed(2),
        total: shippingCost.toFixed(2),
      });
    }

    const totalWithTax = parseFloat(order.total);
    const netTotal = totalWithTax / (1 + KDV_RATE / 100);
    const taxTotal = totalWithTax - netTotal;

    const invoiceData = {
      firmId: FIRM_ID,
      invoiceNo: order.orderNumber,
      invoiceType: 3,
      note: `HANK Online Sipariş - ${order.orderNumber}`,
      dates: {
        invoiceDate: invoiceDate,
        dueDate: invoiceDate,
        deliveryDate: invoiceDate,
      },
      customer: {
        customerId: order.customerEmail,
        title: order.customerName,
        taxOffice: "",
        taxNo: "",
        email: order.customerEmail,
        phone: order.customerPhone || "",
        address: `${shippingAddress.address}, ${shippingAddress.district}, ${shippingAddress.city}`,
      },
      amounts: {
        currency: "TL",
        gross: netTotal.toFixed(2),
        discount: "0.00",
        net: netTotal.toFixed(2),
        tax: taxTotal.toFixed(2),
        total: totalWithTax.toFixed(2),
      },
      details: details,
    };

    console.log("[BizimHesap] Sending invoice:", JSON.stringify(invoiceData, null, 2));

    const response = await fetch(BIZIMHESAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    const result = (await response.json()) as BizimHesapInvoiceResponse;

    if (result.error) {
      console.error("[BizimHesap] Invoice creation failed:", result.error);
      return { success: false, error: result.error };
    }

    console.log("[BizimHesap] Invoice created successfully:", result.guid);
    return {
      success: true,
      guid: result.guid,
      url: result.url,
    };
  } catch (error: any) {
    console.error("[BizimHesap] Error sending invoice:", error);
    return { success: false, error: error.message || "Fatura gönderilemedi" };
  }
}
