import { z } from "zod";

export const usernameSchema = z.string().trim().min(3).max(32)
  .regex(/^[A-Za-z0-9_.-]+$/).transform(value => value.toLowerCase());
export const passwordSchema = z.string().min(8).refine(value => Buffer.byteLength(value, "utf8") <= 72);
export const moneySchema = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
  .refine(value => Number(value) > 0);
export const codeSchema = z.string().trim().min(1).max(100);

export function moneyCents(value: string | number | null | undefined): number {
  const result = Math.round(Number(value || 0) * 100);
  if (!Number.isSafeInteger(result)) throw new Error("Geçersiz tutar");
  return result;
}

export function commissionFor(total: string, type: string | null, value: string | null): string {
  const cents = type === "percentage"
    ? Math.round(moneyCents(total) * Number(value || 0) / 100)
    : type === "per_use" ? moneyCents(value) : 0;
  return (Math.max(0, cents) / 100).toFixed(2);
}

export function eligibleOrder(order: { status: string; payment_status: string }): boolean {
  return order.payment_status === "paid" && !["cancelled", "refunded", "returned"].includes(order.status);
}

export function maskedName(name: string): string {
  const pieces = name.trim().split(/\s+/).filter(Boolean);
  return pieces.length ? `${pieces[0]}${pieces.length > 1 ? ` ${pieces.slice(1).map(p => `${p[0]}.`).join(" ")}` : ""}` : "Müşteri";
}

export class PartnerError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
