import { useState } from "react";
import { LayoutDashboard, LogOut, ReceiptText, Wallet, UserRound } from "lucide-react";
import type { PartnerProfile } from "./partner-api";
import { ErrorBox } from "./PartnerPrimitives";
import Overview from "./Overview";
import Sales from "./Sales";
import Withdrawals from "./Withdrawals";
import Account from "./Account";

type Section = "overview" | "sales" | "withdrawals" | "account";
const sections: Array<{ id: Section; label: string; Icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Genel Bakış", Icon: LayoutDashboard },
  { id: "sales", label: "Satışlarım", Icon: ReceiptText },
  { id: "withdrawals", label: "Çekim Taleplerim", Icon: Wallet },
  { id: "account", label: "Hesabım", Icon: UserRound },
];

export default function PartnerShell({ profile, onLogout }: { profile: PartnerProfile; onLogout: () => Promise<void> }) {
  const [section, setSection] = useState<Section>("overview");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
      <header className="partner-border sticky top-0 z-20 flex h-[68px] items-center justify-between border-b bg-neutral-950 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <a href="/" aria-label="HANK ana sayfa" className="shrink-0 bg-black px-2 py-1"><img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-6 w-auto invert sm:h-7" /></a>
          <span className="hidden h-6 border-l border-neutral-700 sm:block" />
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.17em]">PARTNER</p><p className="partner-muted max-w-[170px] truncate text-[11px]">{profile.name} · {profile.username}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="partner-muted hidden text-xs font-semibold hover:text-white sm:block">Siteye dön</a>
          <button type="button" aria-label="Çıkış yap" onClick={() => void logout()} disabled={logoutBusy} className="inline-flex h-9 items-center gap-2 border border-neutral-700 px-3 text-xs font-bold hover:bg-neutral-800 hover:text-white disabled:opacity-50">
            <LogOut size={14} /><span className="hidden sm:inline">{logoutBusy ? "Çıkış yapılıyor" : "Çıkış yap"}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="partner-border hidden min-h-[calc(100dvh-68px)] border-r px-4 py-7 lg:block">
          <p className="partner-muted mb-4 px-3 text-[9px] font-bold uppercase tracking-[0.2em]">PARTNER PANELİ</p>
          <nav aria-label="Partner bölümleri" className="space-y-1">
            {sections.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)} className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-xs font-semibold ${section === id ? "partner-selected" : "border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>
                <Icon size={16} strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
          <div className="partner-border mt-8 border-t pt-4 px-3">
            <p className="partner-muted text-[9px] font-bold uppercase tracking-[0.16em]">PARTNER KODU</p>
            <p className="mt-1 font-mono text-sm font-bold">{profile.code}</p>
          </div>
        </aside>

        <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8">
          <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
            <label htmlFor="partner-section" className="sr-only">Bölüm seç</label>
            <select id="partner-section" aria-label="Bölüm seç" value={section} onChange={(event) => setSection(event.target.value as Section)} className="partner-input min-w-0 w-full max-w-xs px-3 py-2.5 text-sm font-semibold">
              {sections.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
            <span className="max-w-[45%] shrink-0 truncate font-mono text-xs font-bold" title={profile.code}>{profile.code}</span>
          </div>
          {logoutError && <div className="mb-5"><ErrorBox>{logoutError}</ErrorBox></div>}
          {section === "overview" && <Overview profile={profile} goTo={(next) => setSection(next as Section)} />}
          {section === "sales" && <Sales />}
          {section === "withdrawals" && <Withdrawals />}
          {section === "account" && <Account profile={profile} />}
          <footer className="partner-border partner-muted mt-10 border-t pt-4 text-[9px] font-semibold tracking-[0.12em]">HANK PARTNER</footer>
        </div>
      </div>
    </main>
  );
}
