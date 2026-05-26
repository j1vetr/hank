import { useEffect, useState } from "react";
import { X, Snowflake } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "hank_winter_promo_bar_dismissed_v1";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative w-full bg-gradient-to-r from-black via-zinc-950 to-black border-b border-white/10 text-white overflow-hidden"
      data-testid="bar-winter-promo"
    >
      {/* Subtle shine effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-10 sm:px-12 py-2 sm:py-2.5 flex items-center justify-center gap-3 sm:gap-4">
        <Link
          href="/magaza"
          className="group flex flex-col sm:flex-row items-center justify-center gap-y-0.5 gap-x-3 sm:gap-x-4 text-center hover:opacity-95 transition-opacity"
          data-testid="link-winter-promo"
        >
          {/* Line 1 — Headline */}
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white">
            <Snowflake className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            Tüm Ürünlerde
          </span>

          {/* Divider (desktop only) */}
          <span className="hidden sm:inline-block h-3.5 w-px bg-white/20" />

          {/* Line 2 — Offer details */}
          <span className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] text-white/85 whitespace-nowrap">
            <span className="font-semibold text-white">%20 NET</span>
            <span className="text-white/40">+</span>
            <span className="font-semibold text-white">%10 Sporcu Kodu</span>
            <span className="text-white/40">=</span>
            <span className="font-extrabold text-black bg-white px-1.5 py-0.5 rounded text-[11px] sm:text-xs leading-none tracking-tight">
              %30 İNDİRİM
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 ml-1 text-white/80 underline underline-offset-4 decoration-white/30 group-hover:decoration-white/80 transition-all font-medium">
              Keşfet →
            </span>
          </span>
        </Link>

        <button
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="button-close-winter-promo-bar"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
