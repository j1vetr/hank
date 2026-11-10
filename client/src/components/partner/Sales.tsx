import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { PartnerDashboard } from "./partner-api";
import { dashboardUrl, dateText, money, paymentLabel, request } from "./partner-api";
import { ErrorBox, LoadingRows } from "./PartnerPrimitives";

export default function Sales() {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request<PartnerDashboard>(dashboardUrl({ startDate, endDate, page })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Satışlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page]);
  useEffect(() => { void load(); }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.totalSales || 0) / 20)), [data?.totalSales]);

  return (
    <section className="space-y-6">
      <header className="partner-border border-b pb-5">
        <p className="partner-muted text-[10px] font-bold uppercase tracking-[0.2em]">SİPARİŞ PERFORMANSI</p>
        <h1 className="partner-display mt-1 text-4xl uppercase">Satışlarım</h1>
        <p className="partner-muted mt-2 text-sm">Kodunla ilişkilendirilen siparişler ve komisyon detayları.</p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold"><SlidersHorizontal size={15} />Tarih aralığı</div>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
          <label className="partner-muted text-[10px] font-bold uppercase tracking-wider">Başlangıç
            <input aria-label="Başlangıç tarihi" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="partner-input mt-1 block w-full px-3 py-2 text-xs" />
          </label>
          <label className="partner-muted text-[10px] font-bold uppercase tracking-wider">Bitiş
            <input aria-label="Bitiş tarihi" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="partner-input mt-1 block w-full px-3 py-2 text-xs" />
          </label>
        </div>
      </div>

      {error && <ErrorBox onRetry={() => void load()}>{error}</ErrorBox>}
      {data && (
        <section aria-label="Seçili dönem özeti" className="partner-border grid gap-5 border-y py-4 sm:grid-cols-3">
          <div><p className="partner-muted text-[10px] font-bold uppercase tracking-wider">Dönem siparişleri</p><p className="partner-display mt-1 text-3xl">{data.summary.orderCount}</p></div>
          <div><p className="partner-muted text-[10px] font-bold uppercase tracking-wider">Dönem cirosu</p><p className="partner-display mt-1 text-3xl">{money(data.summary.revenue)}</p></div>
          <div><p className="partner-muted text-[10px] font-bold uppercase tracking-wider">Dönem komisyonu</p><p className="partner-display mt-1 text-3xl">{money(data.summary.commissionEarned)}</p></div>
          <p className="partner-muted sm:col-span-3 text-[11px]">Bu tutarlar seçili tarih aralığına aittir. Bakiye ve ödenen toplam bilgileri Genel Bakış bölümünde tüm zamanlar için gösterilir.</p>
        </section>
      )}

      {loading && !data && <LoadingRows label="Satışlar yükleniyor" />}
      {loading && data && <div aria-live="polite" className="partner-muted text-xs">Satış listesi güncelleniyor</div>}
      {data && data.sales.length > 0 && (
        <div className="partner-border divide-y border-y">
          {data.sales.map((sale) => {
            const status = paymentLabel(sale.paymentStatus, sale.status);
            const isBad = status === "İptal" || status === "İade edildi" || status === "Başarısız";
            return (
              <article key={sale.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">{sale.orderNumber}<span className="partner-muted ml-2 text-xs font-normal">{dateText(sale.createdAt)}</span></h2>
                    <p className="partner-muted mt-1 text-xs">Müşteri: {sale.customerName} · Kod: {sale.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{money(sale.commission)}</p>
                    <p className="partner-muted mt-1 text-[10px]">{sale.commissionEstimated ? "Tahmini komisyon" : "Komisyon"}</p>
                  </div>
                </div>
                <div className="partner-border mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
                  <div className="space-y-1">
                    {sale.items.map((item, index) => (
                      <p key={`${sale.id}-${index}`} className="text-xs text-neutral-300">
                        {item.productName}{item.variantDetails ? ` · ${item.variantDetails}` : ""} <span className="text-neutral-500">× {item.quantity}</span>
                      </p>
                    ))}
                  </div>
                  <span className={`partner-status border px-2.5 py-1 text-[10px] font-bold ${isBad ? "partner-status-muted" : ""}`}>{status}</span>
                </div>
                <p className="partner-muted mt-2 text-right text-[11px]">Sipariş tutarı {money(sale.total)}</p>
              </article>
            );
          })}
        </div>
      )}

      {data && data.sales.length === 0 && !loading && (
        <div className="partner-border border-y px-4 py-12 text-center">
          <p className="partner-display text-2xl uppercase">Satış bulunamadı</p>
          <p className="partner-muted mt-2 text-sm">{startDate || endDate ? "Bu tarih aralığında satış görünmüyor." : "Henüz satış kaydı oluşmadı."}</p>
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between gap-3">
          <span className="partner-muted text-xs">{data.page}. sayfa · {data.totalSales} satış</span>
          <div className="flex gap-2">
            <button aria-label="Önceki sayfa" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="partner-border grid h-9 w-9 place-items-center border disabled:opacity-35"><ChevronLeft size={16} /></button>
            <button aria-label="Sonraki sayfa" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="partner-border grid h-9 w-9 place-items-center border disabled:opacity-35"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
