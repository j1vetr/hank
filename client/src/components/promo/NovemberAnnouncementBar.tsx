import { Link } from 'wouter';
import { isNovemberCampaignWindow, NOVEMBER_HEADLINE, NOVEMBER_OFFER } from '@shared/novemberPromotion';

export default function AnnouncementBar() {
  if (!isNovemberCampaignWindow()) {
    return (
      <div className="hidden h-9 items-center justify-center gap-8 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 lg:flex">
        <span>Yurt dışına gönderim</span>
        <span className="h-3 w-px bg-white/20" />
        <span>2.500 ₺ üzeri ücretsiz kargo</span>
      </div>
    );
  }
  return (
    <div className="w-full overflow-hidden border-b border-black/25 bg-[#d52d25] text-white" data-testid="bar-november-promo">
      <Link
        href="/magaza"
        className="mx-auto flex h-12 max-w-7xl flex-col items-center justify-center gap-0 px-3 text-center lg:h-9 lg:flex-row lg:gap-x-3"
        data-testid="link-november-promo"
      >
        <span className="font-display text-[17px] leading-none tracking-[0.035em] sm:text-xl">{NOVEMBER_HEADLINE}</span>
        <span className="font-sans text-[11px] font-semibold leading-none tracking-[0.06em] lg:ml-1">{NOVEMBER_OFFER}</span>
      </Link>
    </div>
  );
}
