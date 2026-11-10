import type { PartnerDashboard, PartnerProfile, PartnerSale, PartnerWithdrawal } from "@shared/partner";

export type ApiError = { error?: string };

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as ApiError).error || "İşlem tamamlanamadı. Yeniden deneyin.");
  }
  return body as T;
}

export const jsonPost = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const dashboardUrl = (options: { startDate?: string; endDate?: string; page?: number } = {}) => {
  const query = new URLSearchParams();
  if (options.startDate) query.set("startDate", options.startDate);
  if (options.endDate) query.set("endDate", options.endDate);
  query.set("page", String(options.page || 1));
  return `/api/partner/dashboard?${query.toString()}`;
};

export const money = (value: string | number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value) || 0);

export const dateText = (value: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        ...(options || { day: "numeric", month: "short", year: "numeric" }),
      }).format(date);
};

export function paymentLabel(paymentStatus: string, orderStatus: string) {
  const value = `${paymentStatus} ${orderStatus}`.toLowerCase();
  if (value.includes("cancel") || value.includes("iptal")) return "İptal";
  if (value.includes("refund") || value.includes("returned") || value.includes("iade")) return "İade edildi";
  if (value.includes("paid") || value.includes("ödendi") || value.includes("completed")) return "Ödendi";
  if (value.includes("fail")) return "Başarısız";
  if (value.includes("pending") || value.includes("bekle")) return "Bekliyor";
  return paymentStatus || orderStatus;
}

export function commissionText(profile: PartnerProfile) {
  if (!profile.commissionValue) return "Tanımlı değil";
  return profile.commissionType?.toLowerCase().includes("percent")
    ? `%${profile.commissionValue}`
    : money(profile.commissionValue);
}

export type { PartnerDashboard, PartnerProfile, PartnerSale, PartnerWithdrawal };
