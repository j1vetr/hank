import React from 'react';
import { Tag } from 'lucide-react';

export interface OrderPriceSummaryData {
  subtotal?: string | number | null;
  shippingCost?: string | number | null;
  discountAmount?: string | number | null;
  couponCode?: string | null;
  campaignDiscountAmount?: string | number | null;
  campaignDiscountDetails?: {
    campaignName?: string | null;
    discountedItems?: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      discountAmount: string | number;
    }>;
  } | null;
  total?: string | number | null;
}

interface OrderPriceSummaryProps {
  order: OrderPriceSummaryData;
  className?: string;
  totalClassName?: string;
}

function amount(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: string | number | null | undefined): string {
  return `${amount(value).toFixed(2)}₺`;
}

export default function OrderPriceSummary({
  order,
  className = '',
  totalClassName = 'text-white text-xl font-bold pt-2 border-t border-zinc-700',
}: OrderPriceSummaryProps) {
  const campaignDiscount = amount(order.campaignDiscountAmount);
  const couponDiscount = amount(order.discountAmount);
  const campaignName = order.campaignDiscountDetails?.campaignName?.trim();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start justify-between gap-4 text-zinc-400">
        <span className="min-w-0 break-words">Ara Toplam</span>
        <span className="shrink-0 whitespace-nowrap">{formatPrice(order.subtotal)}</span>
      </div>
      <div className="flex items-start justify-between gap-4 text-zinc-400">
        <span className="min-w-0 break-words">Kargo</span>
        <span className="shrink-0 whitespace-nowrap">{formatPrice(order.shippingCost)}</span>
      </div>
      {campaignDiscount > 0 && (
        <div className="flex items-start justify-between gap-4 text-green-400">
          <span className="flex min-w-0 items-start gap-2 break-words">
            <Tag className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              Sepet indirimi{campaignName ? ` (${campaignName})` : ''}
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap">-{formatPrice(campaignDiscount)}</span>
        </div>
      )}
      {couponDiscount > 0 && (
        <div className="flex items-start justify-between gap-4 text-green-400">
          <span className="flex min-w-0 items-start gap-2 break-words">
            <Tag className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              Kupon indirimi{order.couponCode ? ` (${order.couponCode})` : ''}
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap">-{formatPrice(couponDiscount)}</span>
        </div>
      )}
      <div className={`flex items-start justify-between gap-4 ${totalClassName}`}>
        <span className="min-w-0 break-words">Toplam</span>
        <span className="shrink-0 whitespace-nowrap">{formatPrice(order.total)}</span>
      </div>
    </div>
  );
}
