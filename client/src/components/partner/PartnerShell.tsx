import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, ReceiptText, Wallet, UserRound, X } from "lucide-react";
import type { PartnerProfile } from "./partner-api";
import { ErrorBox } from "./PartnerPrimitives";
import Overview from "./Overview";
import Sales from "./Sales";
import Withdrawals from "./Withdrawals";
import Account from "./Account";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

type Section = "overview" | "sales" | "withdrawals" | "account";
const sections: Array<{ id: Section; label: string; Icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Genel Bakış", Icon: LayoutDashboard },
  { id: "sales", label: "Satışlarım", Icon: ReceiptText },
  { id: "withdrawals", label: "Çekim Taleplerim", Icon: Wallet },
  { id: "account", label: "Hesabım", Icon: UserRound },
];

export default function PartnerShell({ profile, onLogout }: { profile: PartnerProfile; onLogout: () => Promise<void> }) {
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeForDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    closeForDesktop();
    desktop.addEventListener("change", closeForDesktop);
    return () => desktop.removeEventListener("change", closeForDesktop);
  }, []);

  const selectSection = (next: Section) => {
    setSection(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = async () => {
    setLogoutBusy(true);
    setLogoutError("");
    try {
      await onLogout();
    } catch (reason) {
      setLogoutError(reason instanceof Error ? reason.message : "Çıkış yapılamadı.");
    } finally {
      setLogoutBusy(false);
    }
  };

  return (
    <main lang="tr" className="partner-root min-h-[100dvh]">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <header className="partner-header partner-border sticky top-0 z-20 flex min-h-[68px] items-center justify-between border-b bg-neutral-950 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
            <a href="/" aria-label="HANK Ana Sayfa" className="shrink-0 bg-black px-2 py-1"><img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-6 w-auto invert sm:h-7" /></a>
            <SheetTrigger asChild>
              <button type="button" aria-label="Partner Menüsünü Aç" className="partner-menu-trigger ml-auto grid h-11 w-11 place-items-center rounded-sm border border-neutral-700 text-white hover:bg-neutral-800 lg:hidden">
                <Menu size={21} aria-hidden="true" />
              </button>
            </SheetTrigger>
            <div className="hidden min-w-0 lg:block"><p className="text-sm font-semibold">Partner</p><p className="partner-muted max-w-[170px] truncate text-sm">{profile.name} · {profile.username}</p></div>
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <a href="/" className="partner-muted text-sm font-semibold hover:text-white">Siteye Dön</a>
            <button type="button" aria-label="Çıkış Yap" onClick={() => void logout()} disabled={logoutBusy} className="inline-flex min-h-11 items-center gap-2 border border-neutral-700 px-4 text-sm font-bold hover:bg-neutral-800 hover:text-white disabled:opacity-50">
              <LogOut size={16} /><span>{logoutBusy ? "Çıkış Yapılıyor" : "Çıkış Yap"}</span>
            </button>
          </div>
        </header>

        <SheetContent side="left" className="partner-root partner-mobile-sheet h-[100dvh] w-[min(88vw,360px)] max-w-none overflow-y-auto overscroll-contain border-r border-neutral-800 bg-neutral-950 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] text-white">
          <SheetClose asChild>
            <button type="button" aria-label="Partner Menüsünü Kapat" className="partner-drawer-close">
              <X size={20} aria-hidden="true" />
            </button>
          </SheetClose>
          <SheetHeader className="space-y-4 pr-12 text-left">
            <a href="/" aria-label="HANK Ana Sayfa" className="w-fit bg-black px-2 py-1"><img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-7 w-auto invert" /></a>
            <div>
              <SheetTitle className="text-left text-xl text-white">Partner Menüsü</SheetTitle>
              <SheetDescription className="mt-1 text-left text-sm text-neutral-400">Hesabını ve partner bölümlerini buradan yönet.</SheetDescription>
            </div>
          </SheetHeader>

          <div className="partner-menu-profile mt-6">
            <p className="partner-break text-base font-semibold">{profile.name}</p>
            <p className="partner-muted mt-1 text-sm">Partner Kodu</p>
            <p className="partner-break mt-1 text-sm font-semibold tracking-wide">{profile.code}</p>
          </div>

          <nav aria-label="Partner Bölümleri" className="mt-6 space-y-2">
            {sections.map(({ id, label, Icon }) => (
              <SheetClose asChild key={id}>
                <button type="button" aria-current={section === id ? "page" : undefined} onClick={() => selectSection(id)} className={`flex min-h-12 w-full items-center gap-3 border-l-2 px-3 text-left text-sm font-semibold ${section === id ? "partner-selected" : "border-transparent text-neutral-300 hover:bg-neutral-900"}`}>
                  <Icon size={18} strokeWidth={1.8} />{label}
                </button>
              </SheetClose>
            ))}
          </nav>

          <div className="partner-border mt-7 border-t pt-5">
            {logoutError && <div className="mb-4"><ErrorBox>{logoutError}</ErrorBox></div>}
            <SheetClose asChild>
              <a href="/" className="flex min-h-12 items-center gap-3 px-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white">
                <span>Siteye Dön</span>
              </a>
            </SheetClose>
            <button type="button" onClick={() => void logout()} disabled={logoutBusy} className="mt-2 flex min-h-12 w-full items-center gap-3 px-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white disabled:opacity-50">
              <LogOut size={18} /><span>{logoutBusy ? "Çıkış Yapılıyor" : "Çıkış Yap"}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="partner-border hidden min-h-[calc(100dvh-68px)] border-r px-4 py-7 lg:block">
          <p className="partner-muted mb-4 px-3 text-sm font-semibold">Partner Paneli</p>
          <nav aria-label="Partner Bölümleri" className="space-y-1">
            {sections.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => selectSection(id)} className={`flex min-h-11 w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-sm font-semibold ${section === id ? "partner-selected" : "border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>
                <Icon size={17} strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
          <div className="partner-border mt-8 border-t px-3 pt-4">
            <p className="partner-muted text-sm font-semibold">Partner Kodu</p>
            <p className="mt-1 break-all text-sm font-semibold tracking-wide">{profile.code}</p>
          </div>
        </aside>

        <div className="partner-content min-w-0 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6 sm:py-7 lg:px-9 lg:py-8">
          {logoutError && <div className="mb-5"><ErrorBox>{logoutError}</ErrorBox></div>}
          {section === "overview" && <Overview profile={profile} goTo={(next) => selectSection(next as Section)} />}
          {section === "sales" && <Sales />}
          {section === "withdrawals" && <Withdrawals />}
          {section === "account" && <Account profile={profile} />}
          <footer className="partner-border partner-muted mt-10 border-t pt-4 text-sm">HANK Partner</footer>
        </div>
      </div>
    </main>
  );
}
