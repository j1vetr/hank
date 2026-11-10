import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { X } from 'lucide-react';
import {
  NOVEMBER_POSTER_480,
  NOVEMBER_POSTER_768,
  NOVEMBER_HEADLINE,
  NOVEMBER_OFFER,
  hasNovemberSessionDismissal,
  isNovemberCampaignWindow,
  isNovemberShoppingRoute,
  rememberNovemberSessionDismissal,
} from '@shared/novemberPromotion';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function NovemberEntryPopup() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [requestPoster, setRequestPoster] = useState(false);
  const [scheduledLocation, setScheduledLocation] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const routeAllowed = isNovemberShoppingRoute(location);
  const eligible = routeAllowed && isNovemberCampaignWindow();

  useEffect(() => {
    if (!eligible || dismissed || hasNovemberSessionDismissal()) {
      setOpen(false);
      setScheduledLocation(null);
      setPosterReady(false);
      setRequestPoster(false);
      return;
    }
    setScheduledLocation(location);
    setOpen(false);
    setPosterReady(false);
    setRequestPoster(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    let cancelled = false;
    const showAfterIdle = () => {
      if (cancelled) return;
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => {
          if (!cancelled) setRequestPoster(true);
        }, { timeout: 900 });
      } else {
        timer = setTimeout(() => {
          if (!cancelled) setRequestPoster(true);
        }, 0);
      }
    };
    timer = setTimeout(showAfterIdle, 1600);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (idleId !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
    };
  }, [eligible, dismissed, location]);

  const close = () => {
    rememberNovemberSessionDismissal();
    setDismissed(true);
    setOpen(false);
  };

  if (!eligible || imageFailed) return null;
  return (
    <>
      {requestPoster && (
        <img
          src={NOVEMBER_POSTER_480}
          srcSet={`${NOVEMBER_POSTER_480} 480w, ${NOVEMBER_POSTER_768} 768w`}
          sizes="(max-width: 640px) 94vw, 480px"
          alt=""
          aria-hidden="true"
          className="hidden"
          decoding="async"
          fetchPriority="low"
          onLoad={() => { setPosterReady(true); setOpen(true); }}
          onError={() => setImageFailed(true)}
        />
      )}
      <Dialog open={open && posterReady && scheduledLocation === location} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
      <DialogContent
        className="flex max-h-[calc(100dvh-20px)] w-[calc(100vw-20px)] max-w-[min(92vw,31rem)] flex-col gap-0 overflow-hidden border border-white/15 bg-[#171513] p-2 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] [&>button:last-child]:hidden sm:p-3"
        data-testid="dialog-november-promo"
      >
        <DialogTitle className="sr-only">{NOVEMBER_HEADLINE}</DialogTitle>
        <DialogDescription className="sr-only">
          {NOVEMBER_OFFER}
        </DialogDescription>
        <DialogClose
          onClick={close}
          aria-label="Kampanya penceresini kapat"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center border border-white/30 bg-black/65 text-white transition-colors hover:bg-black"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        <img
          src={NOVEMBER_POSTER_480}
          srcSet={`${NOVEMBER_POSTER_480} 480w, ${NOVEMBER_POSTER_768} 768w`}
          sizes="(max-width: 640px) 94vw, 480px"
          width={768}
          height={1024}
          alt={`${NOVEMBER_HEADLINE} ${NOVEMBER_OFFER}`}
          className="mx-auto max-h-[calc(100dvh-138px)] w-auto max-w-full object-contain"
          decoding="async"
        />
        <Link
          href="/magaza"
          onClick={close}
          className="mt-2 flex min-h-11 items-center justify-center bg-white px-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#e8e8e8] sm:text-sm"
          data-testid="button-november-discover"
        >
          Kasım fırsatlarını keşfet
        </Link>
        <p className="px-2 pb-1 pt-2 text-center text-[10px] leading-relaxed text-white/60">
          {NOVEMBER_OFFER}
        </p>
      </DialogContent>
      </Dialog>
    </>
  );
}
