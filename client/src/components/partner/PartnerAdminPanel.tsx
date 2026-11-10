import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CircleAlert, KeyRound, LoaderCircle, RefreshCw, Shield, ShieldOff } from "lucide-react";
import type { PartnerAdminData } from "@shared/partner";

type InfluencerCode = { id: string; code: string; influencerName?: string; name?: string; isActive?: boolean };

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "İşlem tamamlanamadı.");
  return body as T;
}

const adminMoney = (value: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value) || 0);
const adminDate = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function PartnerAdminPanel({ influencers }: { influencers: InfluencerCode[] }) {
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

  return (
    <section className="mt-7 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6" aria-labelledby="partner-admin-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-1 text-[10px] font-bold tracking-[.18em] text-lime-400">HANK PARTNER</p><h3 id="partner-admin-title" className="text-lg font-semibold text-white">Partner hesapları ve ödeme talepleri</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">Hesap erişimi ve HANK partner paneline ait manuel ödeme işlemleri.</p></div>
        <button onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />Yenile</button>
      </div>
      {notice && <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-xs leading-5 text-zinc-200"><span>{notice}</span><button aria-label="Bildirimi kapat" onClick={() => setNotice("")} className="font-bold text-zinc-400 hover:text-white">×</button></div>}
      {isLoading ? <div className="grid gap-3 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-zinc-800" />)}</div> : isError ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200"><span className="flex items-center gap-2"><CircleAlert size={16} />{error instanceof Error ? error.message : "Partner verisi alınamadı."}</span><button onClick={() => void refetch()} className="font-semibold underline underline-offset-4">Yeniden dene</button></div> : <>
        <div className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-3"><div><h4 className="text-sm font-semibold text-white">Influencer kodları</h4><p className="mt-1 text-[11px] text-zinc-500">Kayıtlı hesabı olmayan kodlar da listelenir.</p></div><span className="text-[11px] text-zinc-500">{influencers.length} kod</span></div>
          {influencers.length ? <div className="grid gap-2 xl:grid-cols-2">{influencers.map((influencer) => {
            const account = accountsByCoupon.get(influencer.id);
            const name = influencer.influencerName || influencer.name || "İsimsiz partner";
            return <article key={influencer.id} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-zinc-100">{name}</span><code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-lime-300">{influencer.code}</code></div>
                  <p className="mt-1 text-xs text-zinc-500">{account ? <>{account.username} · {account.resetRequired ? "İlk kayıt bekliyor" : "Hesap hazır"} · {adminDate(account.createdAt)}</> : "Partner hesabı oluşturulmadı"}</p>
                  {account && <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${account.enabled ? "text-emerald-400" : "text-amber-400"}`}>{account.enabled ? "Erişim açık" : "Erişim kapalı"}</p>}
                </div>
                {account && <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => accessMutation.mutate({ couponId: influencer.id, enabled: !account.enabled })} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">
                    {account.enabled ? <ShieldOff size={13} /> : <Shield size={13} />}{account.enabled ? "Erişimi kapat" : "Erişimi aç"}
                  </button>
                  <button disabled={busy} onClick={() => { if (window.confirm(`${name} için şifreyi sıfırlamak mı istiyorsunuz? Aktif oturumlar kapatılır. Partner, mevcut kodu ve kendi referans bilgisini kullanarak yeniden kayıt olur.`)) resetMutation.mutate(influencer.id); }} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"><KeyRound size={13} />Şifreyi sıfırla</button>
                </div>}
              </div>
            </article>;
          })}</div> : <p className="rounded-lg border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-500">Henüz influencer kodu bulunmuyor.</p>}
        </div>
        <div className="border-t border-zinc-800 pt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h4 className="text-sm font-semibold text-white">Partner ödeme talepleri</h4><p className="mt-1 text-[11px] text-zinc-500">Ödendi işlemi, bankadan manuel yaptığınız ödemeyi kaydeder. Otomatik banka aktarımı yapılmaz.</p></div><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">{data?.withdrawals.filter((item) => item.status === "pending").length || 0} bekleyen</span></div>
          {data?.withdrawals.length ? <div className="space-y-2">{data.withdrawals.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{item.name}</span><code className="font-mono text-[11px] text-lime-300">{item.code}</code><span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">{item.status === "pending" ? "Bekliyor" : item.status === "paid" ? "Ödendi" : "Reddedildi"}</span></div><p className="mt-1 text-sm font-bold text-zinc-200">{adminMoney(item.amount)} <span className="ml-1 text-[11px] font-normal text-zinc-500">{adminDate(item.createdAt)}</span></p>{item.note && <p className="mt-1 break-words text-xs text-zinc-400">Partner notu: {item.note}</p>}{item.adminNote && <p className="mt-1 break-words text-xs text-zinc-500">Yönetici notu: {item.adminNote}</p>}</div>
            {item.status === "pending" && <div className="flex shrink-0 gap-2"><button disabled={busy} onClick={() => { if (window.confirm(`${adminMoney(item.amount)} tutarındaki talebi ödendi olarak işaretle? Bu işlem yalnızca transfer daha önce manuel yapıldıysa onaylanmalıdır.`)) withdrawalMutation.mutate({ id: item.id, status: "paid" }); }} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50">{withdrawalMutation.isPending ? <LoaderCircle size={13} className="animate-spin" /> : <BadgeCheck size={13} />}Manuel ödendi</button><button disabled={busy} onClick={() => { if (window.confirm(`${item.name} tarafından yapılan ${adminMoney(item.amount)} ödeme talebini reddet?`)) withdrawalMutation.mutate({ id: item.id, status: "rejected" }); }} className="rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">Reddet</button></div>}
          </article>)}</div> : <p className="rounded-lg border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-500">Henüz ödeme talebi bulunmuyor.</p>}
        </div>
      </>}
    </section>
  );
}
