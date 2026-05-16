import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "hank_winter_promo_popup_shown_v2";
const SHOW_DELAY_MS = 1800;

export default function WinterPromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = !!sessionStorage.getItem(STORAGE_KEY);
    } catch {}
    if (alreadyShown) return;

    const t = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    }, SHOW_DELAY_MS);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Kış Kampanyası"
      data-testid="popup-winter-promo"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        data-testid="button-backdrop-close"
      />

      {/* Card */}
      <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white animate-in zoom-in-95 duration-300">
        <button
          onClick={() => setOpen(false)}
          aria-label="Kapat"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-md transition-all"
          data-testid="button-close-winter-popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Responsive image: aspect 3:2 desktop, 4:3 mobile */}
        <Link
          href="/kategori/kis-koleksiyonu"
          onClick={() => setOpen(false)}
          className="block group"
          data-testid="link-winter-promo-image"
        >
          <picture>
            <source
              media="(min-width: 640px)"
              srcSet="/uploads/promo/winter-promo.jpg?v=2"
            />
            <img
              src="/uploads/promo/winter-promo-mobile.jpg?v=2"
              alt="HANK Kış Kampanyası — %25 toplam indirim"
              loading="eager"
              className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
            />
          </picture>
        </Link>

        {/* CTA bar below image */}
        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100">
          <p className="text-zinc-700 text-xs sm:text-sm text-center sm:text-left">
            Sporcu kodunu sepette gir, <strong className="text-black">+%10 ek indirim</strong> kazan!
          </p>
          <Link
            href="/kategori/kis-koleksiyonu"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white font-semibold rounded-full text-sm transition-colors whitespace-nowrap"
            data-testid="button-winter-popup-cta"
          >
            ALIŞVERİŞE BAŞLA
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
