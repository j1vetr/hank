import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUpRight, ArrowRight, BadgeCheck, CalendarDays, Check,
  ChevronLeft, ChevronRight, CircleAlert, Clock3, Dumbbell, KeyRound, LoaderCircle,
  LogOut, RefreshCw, ShieldCheck, Wallet,
} from "lucide-react";
import type { PartnerDashboard, PartnerProfile, PartnerWithdrawal } from "@shared/partner";
import "./partner.css";

type AuthMode = "lookup" | "reference" | "register" | "login";
type ApiError = { error?: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as ApiError).error || "İşlem tamamlanamadı. Yeniden deneyin.");
  return body as T;
}

const money = (value: string | number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value) || 0);

const dateText = (value: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", ...(options || { day: "numeric", month: "short", year: "numeric" }) }).format(date);
};

const inputClass = "partner-input w-full rounded-xl border border-[#d6d8ce] bg-[#fbfbf7] px-4 py-3 text-[15px] text-[#17211c] outline-none transition focus:border-[#819c36] focus:ring-4 focus:ring-[#819c36]/10";

function ErrorBox({ children, onRetry }: { children: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-[#e8c5ba] bg-[#fff5f1] p-4 text-sm text-[#883c2c]">
      <span className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{children}</span>
      {onRetry && <button onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-4">Yeniden dene</button>}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5" aria-label="Panel yükleniyor">
      <div className="h-36 animate-pulse rounded-[28px] bg-[#e8eadf]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[#e8eadf]" />)}</div>
      <div className="h-64 animate-pulse rounded-[28px] bg-[#e8eadf]" />
    </div>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (profile: PartnerProfile) => void }) {
  const [mode, setMode] = useState<AuthMode>("lookup");
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldError("");
    if (!code.trim()) { setFieldError("Kupon kodunu girin."); return; }
    setBusy(true);
    try {
      const result = await request<{ next: "register" | "login"; code: string }>("/api/partner/lookup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim() }),
      });
      setCode(result.code);
      setIdentifier(result.code);
      setMode(result.next === "register" ? "reference" : "login");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kod kontrol edilemedi."); }
    finally { setBusy(false); }
  };

  const submitReference = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldError("");
    if (!referenceCode.trim()) { setFieldError("Size verilen referans kodunu girin."); return; }
    setBusy(true);
    try {
      const result = await request<{ success: boolean }>("/api/partner/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, referenceCode: referenceCode.trim() }),
      });
      if (!result.success) throw new Error("Referans kodu doğrulanamadı.");
      setMode("register");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Referans kodu doğrulanamadı."); }
    finally { setBusy(false); }
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldError("");
    if (mode === "register") {
      if (referenceCode.trim().length === 0) { setFieldError("Size verilen referans kodunu girin."); return; }
      if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) { setFieldError("Kullanıcı adı 3 ile 32 karakter olmalı. Harf, rakam, nokta, alt çizgi ve tire kullanabilirsiniz."); return; }
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setFieldError("Şifre en az 8 karakter olmalı ve 72 baytı aşmamalı."); return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "register" ? "/api/partner/register" : "/api/partner/login";
      const payload = mode === "register"
        ? { code, referenceCode: referenceCode.trim(), username, password }
        : { identifier: identifier.trim() || code, password };
      const profile = await request<PartnerProfile>(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      onAuthenticated(profile);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Giriş yapılamadı."); }
    finally { setBusy(false); }
  };

  return (
    <main lang="tr" className="partner-root min-h-[100dvh] bg-[#f2f3eb] text-[#17211c]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#18221d] text-[#d5f06a]"><Dumbbell size={20} /></span><span className="font-display text-2xl tracking-[0.13em]">HANK</span></div>
        <span className="text-[11px] font-bold tracking-[0.19em] text-[#68736a]">PARTNER ALANI</span>
      </header>
      <div className="mx-auto grid min-h-[calc(100dvh-84px)] max-w-7xl items-center gap-12 px-5 pb-12 md:grid-cols-[1.05fr_.95fr] md:px-10">
        <section className="relative overflow-hidden rounded-[30px] bg-[#19251e] p-7 text-[#f3f4e9] md:min-h-[500px] md:p-12">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[#d5f06a]/20" />
          <div className="absolute -right-8 -top-12 h-56 w-56 rounded-full border border-[#d5f06a]/20" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <div><span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-[#d5f06a]"><ShieldCheck size={13} /> SPORCUYA ÖZEL</span>
              <h1 className="max-w-xl font-display text-5xl leading-[.98] tracking-wide md:text-7xl">ETKİNİ<br />GÖR. EMEĞİNİ<br /><span className="text-[#d5f06a]">KAZAN.</span></h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-[#c1c9bf] md:text-base">HANK topluluğuna kattığın her alışverişi ve kazancını tek bir yerden takip et.</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 pt-5 text-xs text-[#aab5aa]"><span>HANK ATHLETE NETWORK</span><span className="font-mono tracking-widest">01 / PRIVATE</span></div>
          </div>
        </section>
        <section className="mx-auto w-full max-w-md">
          <div className="mb-7"><p className="mb-2 text-[11px] font-bold tracking-[.18em] text-[#71804c]">{mode === "lookup" ? "PARTNER GİRİŞİ" : mode === "reference" ? "REFERANS DOĞRULAMA" : mode === "register" ? "HESABINI OLUŞTUR" : "TEKRAR HOŞ GELDİN"}</p>
            <h2 className="font-display text-4xl tracking-wide">{mode === "lookup" ? "Kodunu kontrol et" : mode === "reference" ? "Referans kodunu doğrula" : mode === "register" ? "Hesabını tamamla" : "Giriş yap"}</h2>
            <p className="mt-2 text-sm leading-6 text-[#68736a]">{mode === "lookup" ? "Sana tanımlanan HANK kodunu girerek devam et." : mode === "reference" ? "Kayıt adımına geçmek için sana verilen referans kodunu gir." : mode === "register" ? "Hesabını güvenle oluşturmak için bilgilerini tamamla." : "Kullanıcı adın veya HANK kodunla devam et."}</p>
          </div>
          {(error || fieldError) && <div className="mb-4"><ErrorBox>{fieldError || error}</ErrorBox></div>}
          {mode === "lookup" ? (
            <>
              <form onSubmit={lookup} className="space-y-4">
                <label className="block text-sm font-semibold" htmlFor="partner-code">HANK kodu</label>
                <input id="partner-code" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} className={inputClass} placeholder="Örn. HANK10" aria-invalid={!!fieldError} />
                <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#19251e] px-5 py-3.5 font-bold text-white transition hover:bg-[#2c3b30] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : null}Devam et <ArrowRight size={17} /></button>
              </form>
              <button onClick={() => { setMode("login"); setIdentifier(""); setError(""); setFieldError(""); }} className="mt-5 text-sm font-semibold text-[#68736a] underline decoration-[#a5ad9c] underline-offset-4">Şifremle giriş yap</button>
            </>
          ) : mode === "reference" ? (
            <form onSubmit={submitReference} className="space-y-4">
              <label className="block text-sm font-semibold" htmlFor="partner-reference">Referans kodu</label>
              <input id="partner-reference" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} className={inputClass} autoComplete="off" aria-invalid={!!fieldError} />
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#19251e] px-5 py-3.5 font-bold text-white transition hover:bg-[#2c3b30] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : null}Doğrula ve devam et <ArrowRight size={17} /></button>
            </form>
          ) : (
            <form onSubmit={submitAuth} className="space-y-4">
              {mode === "register" ? <>
                <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="partner-reference">Referans kodu</label><input id="partner-reference" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} className={inputClass} autoComplete="off" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="partner-username">Kullanıcı adı</label><input id="partner-username" value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} autoComplete="username" /></div>
              </> : <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="partner-identifier">Kullanıcı adı veya kod</label><input id="partner-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={inputClass} autoComplete="username" /></div>}
              <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="partner-password">Şifre</label><input id="partner-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete={mode === "register" ? "new-password" : "current-password"} /></div>
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#19251e] px-5 py-3.5 font-bold text-white transition hover:bg-[#2c3b30] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : null}{mode === "register" ? "Hesabı oluştur" : "Giriş yap"} <ArrowRight size={17} /></button>
            </form>
          )}
          {mode !== "lookup" && <button onClick={() => { setMode("lookup"); setCode(""); setReferenceCode(""); setUsername(""); setPassword(""); setIdentifier(""); setError(""); setFieldError(""); }} className="mt-5 text-sm font-semibold text-[#68736a] underline decoration-[#a5ad9c] underline-offset-4">Farklı kodla devam et</button>}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string; detail: string; icon: typeof Wallet; accent?: boolean }) {
  return <article className={`rounded-2xl border p-4 sm:p-5 ${accent ? "border-[#c5d66e] bg-[#e7efbd]" : "border-[#e0e2d8] bg-[#fbfbf7]"}`}>
    <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-[#68736a]">{label}</span><Icon className="h-4 w-4 text-[#71804c]" /></div>
    <p className="font-display text-2xl tracking-wide sm:text-3xl">{value}</p><p className="mt-1 text-[11px] text-[#707a70]">{detail}</p>
  </article>;
}

function WithdrawalRow({ item }: { item: PartnerWithdrawal }) {
  const statusLabel = item.status === "pending" ? "İncelemede" : item.status === "paid" ? "Ödendi" : "Reddedildi";
  const color = item.status === "pending" ? "bg-[#f7ebc9] text-[#765b12]" : item.status === "paid" ? "bg-[#e4efca] text-[#4b6624]" : "bg-[#f6e3df] text-[#8b4034]";
  return <div className="flex flex-col gap-2 border-b border-[#e7e8df] py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div><p className="text-sm font-semibold">{money(item.amount)}</p><p className="mt-0.5 text-xs text-[#788078]">{dateText(item.createdAt)}{item.note ? ` · ${item.note}` : ""}{item.processedAt ? ` · İşlem: ${dateText(item.processedAt)}` : ""}</p>{item.adminNote && <p className="mt-1 text-xs text-[#788078]">Yönetici notu: {item.adminNote}</p>}</div>
    <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${color}`}>{statusLabel}</span>
  </div>;
}

function paymentLabel(paymentStatus: string, orderStatus: string) {
  const value = `${paymentStatus} ${orderStatus}`.toLowerCase();
  if (value.includes("cancel") || value.includes("iptal")) return "İptal";
  if (value.includes("refund") || value.includes("returned") || value.includes("iade")) return "İade edildi";
  if (value.includes("paid") || value.includes("ödendi") || value.includes("completed")) return "Ödendi";
  if (value.includes("fail")) return "Başarısız";
  if (value.includes("pending") || value.includes("bekle")) return "Bekliyor";
  return paymentStatus || orderStatus;
}

function Dashboard({ profile, onLogout }: { profile: PartnerProfile; onLogout: () => Promise<void> }) {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const query = new URLSearchParams();
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    query.set("page", String(page));
    try {
      const result = await request<PartnerDashboard>(`/api/partner/dashboard?${query.toString()}`);
      setData(result);
    } catch (reason) { setLoadError(reason instanceof Error ? reason.message : "Panel yüklenemedi."); }
    finally { setLoading(false); }
  }, [startDate, endDate, page]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const requestWithdrawal = async (event: FormEvent) => {
    event.preventDefault();
    setWithdrawError(""); setWithdrawSuccess("");
    if (!/^\d+([.,]\d{1,2})?$/.test(withdrawAmount) || Number(withdrawAmount.replace(",", ".")) <= 0) { setWithdrawError("Geçerli bir tutar girin. En fazla iki ondalık basamak kullanın."); return; }
    setWithdrawBusy(true);
    try {
      await request<{ id: string }>("/api/partner/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: withdrawAmount.replace(",", "."), ...(withdrawNote.trim() ? { note: withdrawNote.trim() } : {}) }) });
      setWithdrawAmount(""); setWithdrawNote(""); setWithdrawSuccess("Ödeme talebin alındı. Onay durumunu aşağıdan takip edebilirsin.");
      await loadDashboard();
    } catch (reason) { setWithdrawError(reason instanceof Error ? reason.message : "Talep oluşturulamadı."); }
    finally { setWithdrawBusy(false); }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(""); setPasswordSuccess("");
    const bytes = new TextEncoder().encode(newPassword).length;
    if (newPassword.length < 8 || bytes > 72) { setPasswordError("Yeni şifre en az 8 karakter olmalı ve 72 baytı aşmamalı."); return; }
    setPasswordBusy(true);
    try {
      await request("/api/partner/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, password: newPassword }) });
      setCurrentPassword(""); setNewPassword(""); setPasswordSuccess("Şifren güncellendi. Bu oturum açık kalacak.");
    } catch (reason) { setPasswordError(reason instanceof Error ? reason.message : "Şifre değiştirilemedi."); }
    finally { setPasswordBusy(false); }
  };
  const handleLogout = async () => {
    setLogoutError("");
    setLogoutBusy(true);
    try { await onLogout(); }
    catch (reason) { setLogoutError(reason instanceof Error ? reason.message : "Çıkış yapılamadı."); }
    finally { setLogoutBusy(false); }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.totalSales || 0) / 20)), [data?.totalSales]);
  const summary = data?.summary;
  const commission = profile.commissionValue
    ? profile.commissionType?.toLowerCase().includes("percent")
      ? `%${profile.commissionValue}`
      : money(profile.commissionValue)
    : "Tanımlı değil";

  return (
    <main lang="tr" className="partner-root min-h-[100dvh] bg-[#f2f3eb] text-[#17211c]">
      <header className="sticky top-0 z-20 border-b border-[#e1e4d9] bg-[#f2f3eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#19251e] text-[#d5f06a]"><Dumbbell size={18} /></span><div><p className="font-display text-xl leading-none tracking-[.12em]">HANK <span className="text-[#819c36]">PARTNER</span></p><p className="mt-1 max-w-[180px] truncate text-[11px] text-[#778078]">{profile.name} · {profile.username}</p></div></div>
          <button onClick={() => void handleLogout()} disabled={logoutBusy} className="inline-flex items-center gap-2 rounded-xl border border-[#d8dbd1] px-3 py-2 text-xs font-bold text-[#536056] transition hover:bg-[#e6e9dd] disabled:opacity-50"><LogOut size={15} /><span className="hidden sm:inline">{logoutBusy ? "Çıkış yapılıyor" : "Çıkış yap"}</span></button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <section className="relative overflow-hidden rounded-[26px] bg-[#19251e] p-5 text-[#f4f5ed] sm:p-8">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -right-5 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div><p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#d5f06a]">PARTNER PERFORMANSI</p><h1 className="font-display text-4xl tracking-wide sm:text-5xl">Merhaba, {profile.name}</h1><p className="mt-2 text-sm text-[#bec8bd]">Paylaşımın karşılık buluyor. İşte güncel durumun.</p><p className="mt-3 text-xs text-[#c1c9bf]">Komisyon oranı <b className="ml-1 text-[#d5f06a]">{commission}</b></p></div>
            <div className="flex w-fit items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3"><span className="text-[10px] font-bold tracking-widest text-[#b9c4b8]">KODUN</span><span className="font-mono text-lg font-bold text-[#d5f06a]">{profile.code}</span></div>
          </div>
        </section>
        {(loadError || logoutError) && <ErrorBox onRetry={() => { if (loadError) void loadDashboard(); else setLogoutError(""); }}>{loadError || logoutError}</ErrorBox>}
        {loading && !data ? <SkeletonDashboard /> : data && summary ? <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Kullanılabilir bakiye" value={money(summary.availableBalance)} detail="Yeni ödeme talebi oluşturabilirsin" icon={Wallet} accent />
            <StatCard label="Ayırılmış bakiye" value={money(summary.reservedBalance)} detail="Bekleyen ödeme talepleri" icon={Clock3} />
            <StatCard label="Toplam kazanılan" value={money(summary.commissionEarned)} detail={`${summary.orderCount} sipariş · tüm zamanlar`} icon={ArrowUpRight} />
            <StatCard label="Ödenen toplam" value={money(summary.paidTotal)} detail="Tamamlanan ödemeler" icon={Check} />
          </section>
          <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
            <section className="min-w-0 rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#81904e]">SİPARİŞ PERFORMANSI</p><h2 className="mt-1 font-display text-2xl tracking-wide">Satışların</h2></div>
                <div className="flex items-center gap-2 text-xs text-[#778078]"><CalendarDays size={15} /> Tarih aralığı</div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><label className="min-w-0 text-[10px] font-bold text-[#6d776d]">BAŞLANGIÇ<input aria-label="Başlangıç tarihi" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className={`${inputClass} mt-1 px-2 py-2 text-xs`} /></label><label className="min-w-0 text-[10px] font-bold text-[#6d776d]">BİTİŞ<input aria-label="Bitiş tarihi" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className={`${inputClass} mt-1 px-2 py-2 text-xs`} /></label></div>
              <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-[#f0f2e9] px-4 py-3 text-xs"><span><b className="text-[#19251e]">{data.totalSales}</b><span className="ml-1.5 text-[#6f796f]">eşleşen satış</span></span><span><b className="text-[#19251e]">{money(summary.revenue)}</b><span className="ml-1.5 text-[#6f796f]">dönem cirosu</span></span><span><b className="text-[#19251e]">{money(summary.commissionEarned)}</b><span className="ml-1.5 text-[#6f796f]">dönem kazancı</span></span></div>
              {loading && data ? <div className="space-y-3 py-5">{[1, 2, 3].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-[#edf0e6]" />)}</div> : data.sales.length ? <div className="space-y-3">
                {data.sales.map((sale) => {
                  const statusLabel = paymentLabel(sale.paymentStatus, sale.status);
                  const cancelled = statusLabel === "İptal";
                  return <article key={sale.id} className="rounded-2xl border border-[#e6e8df] p-4 transition hover:border-[#c7d18f]">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">{sale.orderNumber} <span className="ml-1 text-xs font-normal text-[#788078]">· {dateText(sale.createdAt)}</span></p><p className="mt-1 text-xs text-[#778078]">Müşteri: {sale.customerName} · Kod: {sale.code}</p></div><div className="text-right"><p className="text-sm font-bold">{money(sale.commission)}</p><p className="mt-1 text-[10px] text-[#788078]">{sale.commissionEstimated ? "Tahmini komisyon" : "Komisyon"}</p></div></div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eceee6] pt-3"><div className="space-y-1">{sale.items.map((item, index) => <p key={`${sale.id}-${index}`} className="text-xs text-[#606b61]">{item.productName}{item.variantDetails ? ` · ${item.variantDetails}` : ""} <span className="text-[#899188]">× {item.quantity}</span></p>)}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${cancelled ? "bg-[#f6e3df] text-[#8b4034]" : statusLabel === "Ödendi" ? "bg-[#e5efcb] text-[#4b6624]" : "bg-[#f4edda] text-[#765b12]"}`}>{statusLabel}</span></div>
                    <p className="mt-2 text-right text-[11px] text-[#899188]">Sipariş tutarı {money(sale.total)}</p>
                  </article>;
                })}
                <div className="flex items-center justify-between pt-2"><span className="text-xs text-[#778078]">{data.page}. sayfa · {data.totalSales} satış</span><div className="flex gap-2"><button aria-label="Önceki sayfa" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[#dfe2d7] p-2 disabled:opacity-35"><ChevronLeft size={16} /></button><button aria-label="Sonraki sayfa" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#dfe2d7] p-2 disabled:opacity-35"><ChevronRight size={16} /></button></div></div>
              </div> : <div className="rounded-2xl border border-dashed border-[#d9ddd0] px-5 py-10 text-center"><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#eff2e6] text-[#81904e]"><RefreshCw size={17} /></div><p className="font-semibold">Bu aralıkta satış görünmüyor</p><p className="mt-1 text-xs text-[#7b857b]">Farklı bir tarih aralığı seçebilir ya da kodunu paylaşabilirsin.</p></div>}
            </section>
            <div className="space-y-5">
              <section className="rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-5 sm:p-6">
                <div className="mb-4"><p className="text-[10px] font-bold tracking-[.18em] text-[#81904e]">ÖDEME TALEBİ</p><h2 className="mt-1 font-display text-2xl tracking-wide">Kazancını iste</h2></div>
                <p className="mb-4 text-xs leading-5 text-[#6e786e]">Kullanılabilir bakiye: <b className="text-[#19251e]">{money(summary.availableBalance)}</b></p>
                <form onSubmit={requestWithdrawal} className="space-y-3">
                  <label htmlFor="withdraw-amount" className="block text-xs font-bold">Talep tutarı</label><input id="withdraw-amount" inputMode="decimal" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0,00" className={inputClass} />
                  <label htmlFor="withdraw-note" className="block text-xs font-bold">Not <span className="font-normal text-[#899188]">İsteğe bağlı</span></label><input id="withdraw-note" value={withdrawNote} onChange={(event) => setWithdrawNote(event.target.value)} maxLength={250} className={inputClass} placeholder="Yöneticiye not bırak" />
                  {withdrawError && <ErrorBox>{withdrawError}</ErrorBox>}{withdrawSuccess && <p role="status" className="rounded-xl bg-[#eaf1d7] px-3 py-2 text-xs leading-5 text-[#4b6624]">{withdrawSuccess}</p>}
                  <button disabled={withdrawBusy} className="w-full rounded-xl bg-[#19251e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2c3b30] disabled:opacity-60">{withdrawBusy ? "Talep gönderiliyor..." : "Ödeme talebi oluştur"}</button>
                </form>
                <p className="mt-4 border-t border-[#e9ebe3] pt-3 text-[11px] leading-5 text-[#788078]">Ödemeler otomatik olarak bankaya aktarılmaz. Talebin yönetici tarafından incelenir ve manuel olarak işlenir.</p>
              </section>
              <section className="rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-5 sm:p-6"><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-xl tracking-wide">Taleplerin</h2><span className="text-[10px] font-bold uppercase tracking-widest text-[#81904e]">Geçmiş</span></div>
                {data.withdrawals.length ? data.withdrawals.map((item) => <WithdrawalRow key={item.id} item={item} />) : <p className="py-5 text-center text-xs text-[#788078]">Henüz ödeme talebin yok.</p>}
              </section>
              <section className="rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-5 sm:p-6"><h2 className="mb-2 font-display text-xl tracking-wide">Ödenenler</h2>
                {data.payments.length ? data.payments.map((payment) => <div key={payment.id} className="flex items-start justify-between gap-3 border-b border-[#e7e8df] py-3 last:border-0"><div><p className="text-sm font-semibold">{money(payment.amount)}</p><p className="mt-0.5 text-xs text-[#788078]">{dateText(payment.paidAt)}{payment.note ? ` · ${payment.note}` : ""}</p></div><BadgeCheck size={17} className="mt-1 text-[#77943c]" /></div>) : <p className="py-5 text-center text-xs text-[#788078]">Henüz ödeme kaydı yok.</p>}
              </section>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7]"><div className="border-b border-[#e6e8df] px-5 py-4"><p className="text-[10px] font-bold tracking-[.18em] text-[#81904e]">AYLIK ÖZET</p><h2 className="font-display text-2xl tracking-wide">Dönem performansı</h2></div>
              {data.monthly.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#f0f2e9] text-[10px] uppercase tracking-wider text-[#718071]"><tr><th className="px-5 py-3">Ay</th><th className="px-3 py-3 text-right">Sipariş</th><th className="px-3 py-3 text-right">Ciro</th><th className="px-5 py-3 text-right">Komisyon</th></tr></thead><tbody>{data.monthly.map((item) => <tr key={item.month} className="border-t border-[#eceee6]"><td className="px-5 py-3 font-semibold">{dateText(`${item.month}-01`, { month: "long", year: "numeric" })}</td><td className="px-3 py-3 text-right">{item.count}</td><td className="px-3 py-3 text-right">{money(item.revenue)}</td><td className="px-5 py-3 text-right font-semibold">{money(item.commission)}</td></tr>)}</tbody></table></div> : <p className="px-5 py-8 text-center text-xs text-[#788078]">Aylık performans kaydı bulunmuyor.</p>}
            </section>
            <section className="rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7]"><div className="border-b border-[#e6e8df] px-5 py-4"><p className="text-[10px] font-bold tracking-[.18em] text-[#81904e]">ÜRÜN TERCİHLERİ</p><h2 className="font-display text-2xl tracking-wide">En çok tercih edilenler</h2></div>
              {data.topProducts.length ? <div className="divide-y divide-[#eceee6]">{data.topProducts.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-4 px-5 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#edf1df] font-mono text-xs font-bold text-[#71804c]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span><span className="whitespace-nowrap text-xs text-[#778078]">{item.quantity} adet</span></div>)}</div> : <p className="px-5 py-8 text-center text-xs text-[#788078]">Ürün verisi henüz oluşmadı.</p>}
            </section>
          </div>
          <section className="rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf1df] text-[#71804c]"><KeyRound size={17} /></span><div><h2 className="font-display text-xl tracking-wide">Şifre güvenliği</h2><p className="text-xs text-[#778078]">Bu cihazdaki oturumun kapanmaz.</p></div></div>
            <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div><label htmlFor="current-password" className="mb-1.5 block text-xs font-bold">Mevcut şifre</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></div>
              <div><label htmlFor="new-password" className="mb-1.5 block text-xs font-bold">Yeni şifre</label><input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /></div>
              <button disabled={passwordBusy} className="rounded-xl border border-[#cbd2b7] px-5 py-3 text-sm font-bold text-[#354333] transition hover:bg-[#eff2e6] disabled:opacity-60">{passwordBusy ? "Kaydediliyor..." : "Şifreyi güncelle"}</button>
              {passwordError && <div className="sm:col-span-2 lg:col-span-3"><ErrorBox>{passwordError}</ErrorBox></div>}{passwordSuccess && <p role="status" className="text-xs text-[#4b6624] sm:col-span-2 lg:col-span-3">{passwordSuccess}</p>}
            </form>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[10px] text-[#849084]"><span>HANK ATHLETE NETWORK · ÖZEL PARTNER PANELİ</span><span>Özet bakiye tüm zamanları kapsar</span></footer>
        </> : null}
      </div>
    </main>
  );
}

export default function Partner() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const checkSession = useCallback(async () => {
    setChecking(true); setSessionError("");
    try { setProfile(await request<PartnerProfile>("/api/partner/me")); }
    catch (reason) {
      const message = reason instanceof Error ? reason.message : "Oturum kontrol edilemedi.";
      if (message.toLowerCase().includes("unauth") || message.toLowerCase().includes("giriş") || message.toLowerCase().includes("yetki")) setProfile(null);
      else { setProfile(null); setSessionError(message); }
    } finally { setChecking(false); }
  }, []);
  useEffect(() => { void checkSession(); }, [checkSession]);
  const logout = async () => {
    try { await request("/api/partner/logout", { method: "POST" }); setProfile(null); }
    catch (reason) { throw reason instanceof Error ? reason : new Error("Çıkış yapılamadı."); }
  };
  if (checking) return <main lang="tr" className="partner-root grid min-h-[100dvh] place-items-center bg-[#f2f3eb]"><div className="w-full max-w-lg space-y-4 px-5"><div className="h-10 w-40 animate-pulse rounded-lg bg-[#e1e5d7]" /><div className="h-64 animate-pulse rounded-[28px] bg-[#e1e5d7]" /><div className="h-16 animate-pulse rounded-2xl bg-[#e1e5d7]" /></div></main>;
  if (profile) return <Dashboard profile={profile} onLogout={logout} />;
  if (sessionError) return <main lang="tr" className="partner-root grid min-h-[100dvh] place-items-center bg-[#f2f3eb] p-5"><div className="w-full max-w-md rounded-[24px] border border-[#e0e2d8] bg-[#fbfbf7] p-6"><ErrorBox onRetry={() => void checkSession()}>{sessionError}</ErrorBox></div></main>;
  return <AuthScreen onAuthenticated={(result) => setProfile(result)} />;
}
