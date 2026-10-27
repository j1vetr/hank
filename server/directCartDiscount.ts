import type { AutoCartCampaign } from "@shared/schema";
import { getCampaignPresentation } from "@shared/campaignDisplay";
import type { CampaignLine, CartCampaignPricing } from "./cartCampaign";

/** Allocate one cart-wide discount only to eligible lines, without losing cents. */
export function calculateDirectCartDiscount(
  lines: CampaignLine[],
  campaign: AutoCartCampaign,
  subtotal: number,
): CartCampaignPricing {
  const eligible = lines
    .map((line, index) => ({ index, cents: Math.round(line.lineSubtotal * 100) }))
    .filter(row => lines[row.index].eligible && row.cents > 0);
  const eligibleCents = eligible.reduce((sum, row) => sum + row.cents, 0);
  const discountCents = Math.max(0, Math.min(
    eligibleCents,
    campaign.discountType === "fixed"
      ? Math.round(Number(campaign.discountAmount) * 100)
      : Math.round(eligibleCents * Number(campaign.discountPercentage) / 100),
  ));
  if (discountCents > 0 && eligibleCents > 0) {
    // Integer arithmetic avoids precision loss when allocating large amounts.
    const denominator = BigInt(eligibleCents);
    const shares = eligible.map(row => {
      const numerator = BigInt(discountCents) * BigInt(row.cents);
      return {
        ...row,
        discount: Number(numerator / denominator),
        remainder: Number(numerator % denominator),
      };
    });
    let remaining = discountCents - shares.reduce((sum, row) => sum + row.discount, 0);
    for (const share of [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
      if (remaining <= 0) break;
      share.discount += 1;
      remaining -= 1;
    }
    for (const share of shares) {
      const line = lines[share.index];
      line.discountAmount = share.discount / 100;
      line.discountedQuantity = share.discount > 0 ? line.quantity : 0;
      line.discountedUnitPrice = Math.floor((share.cents - share.discount) / line.quantity) / 100;
    }
  }
  const presentation = getCampaignPresentation(campaign);
  const campaignDiscount = discountCents / 100;
  return {
    subtotal,
    campaignDiscount,
    discountedSubtotal: Math.max(0, Math.round(subtotal * 100) - discountCents) / 100,
    campaign: {
      id: campaign.id,
      ...presentation,
      campaignType: "direct",
      discountType: campaign.discountType,
      discountAmount: campaign.discountAmount,
      buyQuantity: 0,
      rewardQuantity: 0,
      discountPercentage: Number(campaign.discountPercentage),
    },
    campaignDiscountDetails: {
      campaignName: presentation.name,
      discountedItems: lines.filter(line => line.discountAmount > 0).map(line => ({
        productId: line.productId,
        ...(line.variantId ? { variantId: line.variantId } : {}),
        quantity: line.discountedQuantity,
        discountAmount: line.discountAmount.toFixed(2),
      })),
    },
    eligibleItemCount: lines.filter(line => line.eligible).reduce((sum, line) => sum + line.quantity, 0),
    requiredItemCount: 0,
    applications: discountCents > 0 ? 1 : 0,
    remainingItems: 0,
    progressMessage: discountCents > 0
      ? `${campaignDiscount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL indirim sepetine uygulandı. Kupon kodunla avantajını artırabilirsin.`
      : "İndirimden yararlanmak için kampanyaya dahil ürünleri sepete ekle.",
    lines,
  };
}
