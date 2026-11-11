import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CircleAlert, KeyRound, LoaderCircle, RefreshCw, Shield, ShieldOff } from "lucide-react";
import type { PartnerAdminData } from "@shared/partner";

type InfluencerCode = { id: string; code: string; influencerName?: string; name?: string; isActive?: boolean };
type PartnerAdminView = "accounts" | "withdrawals";

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "İşlem tamamlanamadı.");
  return body as T;
}

const adminMoney = (value: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value) || 0);
const adminDate = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function PartnerAdminPanel({ influencers, view }: { influencers: InfluencerCode[]; view: PartnerAdminView }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PartnerAdminData>({
    queryKey: ["admin-partners"],
    queryFn: () => adminRequest<PartnerAdminData>("/api/admin/partners"),
  });
  const refreshFinance = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-influencer-coupons"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-influencer-analytics"] });
  };
  const accessMutation = useMutation({
    mutationFn: ({ couponId, enabled }: { couponId: string; enabled: boolean }) => adminRequest(`/api/admin/partners/${encodeURIComponent(couponId)}/access`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }),
    }),
    onSuccess: () => { setNotice("Hesap erişimi güncellendi."); void queryClient.invalidateQueries({ queryKey: ["admin-partners"] }); },
    onError: (reason: Error) => setNotice(reason.message),
  });
  const resetMutation = useMutation({
    mutationFn: (couponId: string) => adminRequest(`/api/admin/partners/${encodeURIComponent(couponId)}/reset-password`, { method: "POST" }),
    onSuccess: () => { setNotice("Şifre sıfırlandı ve aktif oturumlar kapatıldı. Sporcu kodu ve referans bilgisiyle yeniden kayıt olabilir."); void queryClient.invalidateQueries({ queryKey: ["admin-partners"] }); },
    onError: (reason: Error) => setNotice(reason.message),
  });
  const withdrawalMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "paid" | "rejected"; note?: string }) => adminRequest(`/api/admin/partner-withdrawals/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(note ? { note } : {}) }),
    }),
    onSuccess: () => { setNotice("Talep durumu güncellendi. Ödeme kaydı yalnızca daha önce manuel yapılan transferi belirtir."); refreshFinance(); },
    onError: (reason: Error) => setNotice(reason.message),
  });
  const accountsByCoupon = new Map((data?.accounts || []).map((account) => [account.couponId, account]));
  const busy = accessMutation.isPending || resetMutation.isPending || withdrawalMutation.isPending;
  const pendingCount = data?.withdrawals.filter((item) => item.status === "pending").length || 0;
  const isAccounts = view === "accounts";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6" aria-labelledby="partner-admin-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">HANK PARTNER</p>
          <h2 id="partner-admin-title" className="text-lg font-semibold tracking-tight text-white">{isAccounts ? "Partner Hesapları" : "Ödeme Talepleri"}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">
            {isAccounts ? "Partner paneli erişimlerini ve hesap durumlarını yönetin." : "Talepleri inceleyin. Manuel ödeme kaydı banka transferi gerçekleştirmez."}
          </p>
        </div>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Yenile
        </button>
      </div>

      {notice && <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs leading-5 text-zinc-200"><span>{notice}</span><button type="button" aria-label="Bildirimi kapat" onClick={() => setNotice("")} className="font-bold text-zinc-400 hover:text-white">×</button></div>}

      {isLoading ? (
        <div aria-label={isAccounts ? "Partner hesapları yükleniyor" : "Ödeme talepleri yükleniyor"} className="space-y-2">
          {[0, 1, 2].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 sm:flex-row sm:items-center">
          <p role="alert" className="flex items-start gap-2 text-sm leading-6 text-rose-200"><CircleAlert size={16} className="mt-1 shrink-0" />{error instanceof Error ? error.message : "Partner verisi alınamadı."}</p>
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="min-h-10 rounded-lg border border-rose-800 px-3 text-xs font-semibold text-rose-100 hover:bg-rose-900/30 disabled:opacity-50">Yeniden Dene</button>
        </div>
      ) : isAccounts ? (
        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><h3 className="text-sm font-semibold text-white">Influencer Kodları</h3><p className="mt-1 text-[11px] text-zinc-500">Partner hesabı henüz açılmamış kodlar da listelenir.</p></div>
            <span className="text-[11px] text-zinc-500">{influencers.length} kod</span>
          </div>
          {influencers.length ? <div className="grid gap-2 xl:grid-cols-2">{influencers.map((influencer) => {
            const account = accountsByCoupon.get(influencer.id);
            const name = influencer.influencerName || influencer.name || "İsimsiz Partner";
            return <article key={influencer.id} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-zinc-100">{name}</span><code className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">{influencer.code}</code></div>
                  <p className="mt-1 text-xs text-zinc-500">{account ? <>{account.username} · {account.resetRequired ? "İlk Kayıt Bekliyor" : "Hesap Hazır"} · {adminDate(account.createdAt)}</> : "Partner hesabı oluşturulmadı"}</p>
                  {account && <p className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${account.enabled ? "border-emerald-900 bg-emerald-950/40 text-emerald-300" : "border-amber-900 bg-amber-950/30 text-amber-300"}`}>{account.enabled ? "Erişim Açık" : "Erişim Kapalı"}</p>}
                </div>
                {account && <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => accessMutation.mutate({ couponId: influencer.id, enabled: !account.enabled })} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                    {accessMutation.isPending && accessMutation.variables?.couponId === influencer.id ? <LoaderCircle size={13} className="animate-spin" /> : account.enabled ? <ShieldOff size={13} /> : <Shield size={13} />}
                    {account.enabled ? "Erişimi Kapat" : "Erişimi Aç"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${name} için şifreyi sıfırlamak mı istiyorsunuz? Aktif oturumlar kapatılır. Partner, mevcut kodu ve kendi referans bilgisini kullanarak yeniden kayıt olur.`)) resetMutation.mutate(influencer.id); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                    {resetMutation.isPending && resetMutation.variables === influencer.id ? <LoaderCircle size={13} className="animate-spin" /> : <KeyRound size={13} />} Şifreyi Sıfırla
                  </button>
                </div>}
              </div>
            </article>;
          })}</div> : <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-5 py-10 text-center"><p className="text-sm font-medium text-zinc-300">Henüz influencer kodu bulunmuyor</p><p className="mt-1 text-xs text-zinc-500">Genel sekmesinden yeni bir influencer kodu ekleyebilirsiniz.</p></div>}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-white">Partner Ödeme Talepleri</h3><p className="mt-1 text-[11px] leading-5 text-zinc-500">Manuel Ödendi işlemi yalnızca daha önce bankadan yaptığınız transferi kaydeder. Otomatik banka aktarımı yapılmaz.</p></div>
            <span className="rounded-full border border-amber-900/70 bg-amber-950/30 px-2.5 py-1 text-[10px] font-bold text-amber-200">{pendingCount} Bekleyen</span>
          </div>
          {data?.withdrawals.length ? <div className="space-y-2">{data.withdrawals.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{item.name}</span><code className="font-mono text-[11px] text-zinc-300">{item.code}</code><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.status === "pending" ? "border-amber-900 bg-amber-950/30 text-amber-200" : item.status === "paid" ? "border-emerald-900 bg-emerald-950/30 text-emerald-200" : "border-rose-900 bg-rose-950/30 text-rose-200"}`}>{item.status === "pending" ? "Bekliyor" : item.status === "paid" ? "Ödendi" : "Reddedildi"}</span></div>
              <p className="mt-1 text-sm font-bold text-zinc-100">{adminMoney(item.amount)} <span className="ml-1 text-[11px] font-normal text-zinc-500">{adminDate(item.createdAt)}</span></p>
              {item.note && <p className="mt-1 break-words text-xs text-zinc-400">Partner Notu: {item.note}</p>}{item.adminNote && <p className="mt-1 break-words text-xs text-zinc-500">Yönetici Notu: {item.adminNote}</p>}
            </div>
            {item.status === "pending" && <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${adminMoney(item.amount)} tutarındaki talebi ödendi olarak işaretle? Bu işlem yalnızca transfer daha önce manuel yapıldıysa onaylanmalıdır.`)) withdrawalMutation.mutate({ id: item.id, status: "paid" }); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                {withdrawalMutation.isPending && withdrawalMutation.variables?.id === item.id && withdrawalMutation.variables.status === "paid" ? <LoaderCircle size={13} className="animate-spin" /> : <BadgeCheck size={13} />} Manuel Ödendi
              </button>
              <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${item.name} tarafından yapılan ${adminMoney(item.amount)} ödeme talebini reddet?`)) withdrawalMutation.mutate({ id: item.id, status: "rejected" }); }} className="min-h-10 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-rose-800 hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50">
                {withdrawalMutation.isPending && withdrawalMutation.variables?.id === item.id && withdrawalMutation.variables.status === "rejected" ? <LoaderCircle size={13} className="inline animate-spin" /> : null} Reddet
              </button>
            </div>}
          </article>)}</div> : <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-5 py-10 text-center"><p className="text-sm font-medium text-zinc-300">Henüz ödeme talebi bulunmuyor</p><p className="mt-1 text-xs text-zinc-500">Yeni talepler bu alanda görünecek.</p></div>}
        </div>
      )}
    </section>
  );
}
