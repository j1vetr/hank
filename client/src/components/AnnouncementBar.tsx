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
      className="relative w-full bg-gradient-to-r from-black via-zinc-900 to-black border-b border-white/10 text-white"
      data-testid="bar-winter-promo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 sm:gap-3 text-center">
        <Snowflake className="w-4 h-4 text-sky-300 shrink-0 animate-pulse hidden sm:block" />
        <Link
          href="/kategori/kis-koleksiyonu"
          className="group flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm tracking-wide hover:opacity-90 transition-opacity"
          data-testid="link-winter-promo"
        >
          <span className="hidden sm:inline font-bold uppercase tracking-widest text-white">
            KIŞ FIRSATI
          </span>
          <span className="sm:hidden font-bold">❄️ KIŞ</span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="text-white/90">
            Kış ürünlerinde{" "}
            <span className="font-semibold text-white">%15 NET</span>
            {" + "}
            <span className="font-semibold text-white">%10 Sporcu Kodu</span>
            {" = "}
            <span className="font-extrabold text-white bg-white/10 px-1.5 py-0.5 rounded">
              %25 İndirim
            </span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 underline underline-offset-2 group-hover:no-underline text-white/90 font-medium">
            Hemen Keşfet →
          </span>
        </Link>
        <button
          onClick={handleClose}
          aria-label="Kapat"
          className="ml-2 sm:ml-4 shrink-0 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="button-close-winter-promo-bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
