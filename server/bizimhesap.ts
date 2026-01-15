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

    const details: InvoiceDetail[] = orderItems.map((item) => {
      const itemTotal = parseFloat(item.subtotal);
      const netAmount = itemTotal / (1 + KDV_RATE / 100);
      const taxAmount = itemTotal - netAmount;

      return {
        productId: item.productId || item.id,
        productName: item.productName,
        note: item.variantDetails || "",
        barcode: "",
        taxRate: `${KDV_RATE}.00`,
        quantity: item.quantity,
        unitPrice: (netAmount / item.quantity).toFixed(2),
        grossPrice: netAmount.toFixed(2),
        discount: "0.00",
        net: netAmount.toFixed(2),
        tax: taxAmount.toFixed(2),
        total: itemTotal.toFixed(2),
      };
    });

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
