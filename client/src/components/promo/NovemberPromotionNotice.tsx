import { isNovemberCampaignWindow, NOVEMBER_HEADLINE, NOVEMBER_OFFER } from '@shared/novemberPromotion';

function NovemberNotice() {
  return (
    <aside className="border-l-2 border-[#d44b3e] bg-[#d44b3e]/[0.08] px-4 py-3 text-sm text-white" data-testid="november-promo-notice">
      <p className="font-bold tracking-wide">{NOVEMBER_HEADLINE}</p>
      <p className="mt-1 text-xs font-semibold tracking-wide text-white/75">{NOVEMBER_OFFER}</p>
    </aside>
  );
}

export function NovemberProductNotice() {
  if (!isNovemberCampaignWindow()) return null;
  return <div className="mt-4"><NovemberNotice /></div>;
}

export function NovemberCartNotice({ itemCount }: { itemCount: number }) {
  if (!isNovemberCampaignWindow() || itemCount < 1) return null;
  return <NovemberNotice />;
}
