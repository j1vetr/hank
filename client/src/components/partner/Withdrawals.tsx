import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BadgeCheck, LoaderCircle } from "lucide-react";
import type { PartnerDashboard, PartnerWithdrawal } from "./partner-api";
import { dashboardUrl, dateText, jsonPost, money, request } from "./partner-api";
import { ErrorBox, LoadingRows } from "./PartnerPrimitives";

function WithdrawalItem({ item }: { item: PartnerWithdrawal }) {
  const status = item.status === "pending" ? "İncelemede" : item.status === "paid" ? "Ödendi" : "Reddedildi";
  return (
    <article className="partner-border border-b py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="partner-break min-w-0 flex-1">
          <p className="text-sm font-bold">{money(item.amount)}</p>
          <p className="partner-muted mt-1 text-sm">{dateText(item.createdAt)}{item.note ? ` · ${item.note}` : ""}</p>
          {item.processedAt && <p className="partner-muted mt-1 text-sm">İşlem Tarihi: {dateText(item.processedAt)}</p>}
          {item.adminNote && <p className="partner-border mt-2 border-l-2 pl-2 text-sm text-neutral-300">Yönetici Notu: {item.adminNote}</p>}
        </div>
        <span className="partner-status border px-2.5 py-1 text-sm font-bold">{status}</span>
      </div>
    </article>
  );
}

export default function Withdrawals() {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request<PartnerDashboard>(dashboardUrl({ page: 1 })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ödeme bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    if (!/^\d+([.,]\d{1,2})?$/.test(amount) || Number(amount.replace(",", ".")) <= 0) {
      setFormError("Geçerli bir tutar gir. En fazla iki ondalık basamak kullan.");
      return;
    }
    setBusy(true);
    try {
      await request<{ id: string }>("/api/partner/withdrawals", jsonPost({
        amount: amount.replace(",", "."),
        ...(note.trim() ? { note: note.trim() } : {}),
      }));
      setAmount("");
      setNote("");
      setSuccess("Ödeme talebin alındı. Onay durumunu aşağıdan takip edebilirsin.");
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Talep oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  };

  const summary = data?.summary;
  return (
    <section className="space-y-7">
      <header className="partner-border border-b pb-5">
        <p className="partner-muted text-sm font-semibold">Bakiye Ve Ödeme</p>
        <h1 className="partner-display mt-1 text-3xl">Çekim Taleplerim</h1>
        <p className="partner-muted mt-2 text-sm">Ödeme talebini oluştur ve tüm işlem durumlarını takip et.</p>
      </header>

      {error && <ErrorBox onRetry={() => void load()}>{error}</ErrorBox>}
      {loading && !data && <LoadingRows label="Ödeme bilgileri yükleniyor" />}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="partner-stat-card min-w-0"><p className="partner-muted text-sm font-semibold">Kullanılabilir Bakiye</p><p className="partner-display partner-stat-value mt-1 text-xl sm:text-2xl">{money(summary.availableBalance)}</p></div>
          <div className="partner-stat-card min-w-0"><p className="partner-muted text-sm font-semibold">Ayırılmış Bakiye</p><p className="partner-display partner-stat-value mt-1 text-xl sm:text-2xl">{money(summary.reservedBalance)}</p></div>
          <div className="partner-stat-card min-w-0"><p className="partner-muted text-sm font-semibold">Ödenen Toplam</p><p className="partner-display partner-stat-value mt-1 text-xl sm:text-2xl">{money(summary.paidTotal)}</p></div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <section className="partner-card h-fit p-5 sm:p-6">
          <p className="partner-muted text-sm font-semibold">Yeni Talep</p>
          <h2 className="partner-display mt-1 text-2xl">Ödeme İste</h2>
          <p className="partner-muted mt-2 text-sm">Kullanılabilir Bakiye: <strong className="text-white">{summary ? money(summary.availableBalance) : "…"}</strong></p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm font-bold">Talep Tutarı</label>
              <input id="withdraw-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className="partner-input w-full px-3.5 py-3 text-base sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="withdraw-note" className="mb-1.5 block text-sm font-bold">Not <span className="partner-muted font-normal">İsteğe Bağlı</span></label>
              <input id="withdraw-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={250} placeholder="Yöneticiye Not Bırak" className="partner-input w-full px-3.5 py-3 text-base sm:text-sm" />
            </div>
            {formError && <ErrorBox>{formError}</ErrorBox>}
            {success && <p role="status" className="partner-border border px-3 py-2 text-sm leading-5">{success}</p>}
            <button disabled={busy} className="partner-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold disabled:opacity-60">
              {busy && <LoaderCircle size={16} className="animate-spin" />}Çekim Talebi Oluştur
            </button>
          </form>
          <p className="partner-border partner-muted mt-4 border-t pt-3 text-sm leading-5">Ödemeler otomatik aktarılmaz. Talebin yönetici tarafından incelenir ve manuel olarak işlenir.</p>
        </section>

        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-end justify-between"><div><p className="partner-muted text-sm font-semibold">Talep Durumları</p><h2 className="partner-display text-2xl">Talep Geçmişi</h2></div></div>
            {loading && !data ? <LoadingRows label="Talep geçmişi yükleniyor" /> : data?.withdrawals.length ? (
              <div className="partner-border border-y">{data.withdrawals.map((item) => <WithdrawalItem key={item.id} item={item} />)}</div>
            ) : <p className="partner-border partner-muted border-y py-8 text-sm">Henüz ödeme talebin yok.</p>}
          </section>
          <section>
            <div className="mb-3"><p className="partner-muted text-sm font-semibold">Tamamlanan Ödemeler</p><h2 className="partner-display text-2xl">Ödeme Geçmişi</h2></div>
            {data?.payments.length ? (
              <div className="partner-border border-y">
                {data.payments.map((payment) => (
                  <article key={payment.id} className="partner-border flex items-start justify-between gap-3 border-b py-4 last:border-0">
                    <div className="partner-break min-w-0"><p className="text-sm font-bold">{money(payment.amount)}</p><p className="partner-muted mt-1 text-sm">{dateText(payment.paidAt)}{payment.note ? ` · ${payment.note}` : ""}</p></div>
                    <BadgeCheck size={17} aria-label="Ödendi" className="mt-1 shrink-0" />
                  </article>
                ))}
              </div>
            ) : <p className="partner-border partner-muted border-y py-8 text-sm">Henüz ödeme kaydı yok.</p>}
          </section>
        </div>
      </div>
    </section>
  );
}
