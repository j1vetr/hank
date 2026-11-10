import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { PartnerDashboard } from "./partner-api";
import { dashboardUrl, dateText, money, paymentLabel, request } from "./partner-api";
import { ErrorBox, LoadingRows, ProductThumbnail } from "./PartnerPrimitives";

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
        <p className="partner-muted text-sm font-semibold">Sipariş Performansı</p>
        <h1 className="partner-display mt-1 text-3xl">Satışlarım</h1>
        <p className="partner-muted mt-2 text-sm">Kodunla ilişkilendirilen siparişler ve komisyon detayları.</p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={15} />Tarih Aralığı</div>
        <div className="grid w-full grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:w-auto">
          <label className="partner-muted text-sm font-semibold">Başlangıç Tarihi
            <input aria-label="Başlangıç Tarihi" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="partner-input mt-1 block w-full px-3 py-2 text-base sm:text-sm" />
          </label>
          <label className="partner-muted text-sm font-semibold">Bitiş Tarihi
            <input aria-label="Bitiş Tarihi" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="partner-input mt-1 block w-full px-3 py-2 text-base sm:text-sm" />
          </label>
        </div>
      </div>

      {error && <ErrorBox onRetry={() => void load()}>{error}</ErrorBox>}
      {data && (
        <section aria-label="Seçili Dönem Özeti" className="partner-border grid grid-cols-1 gap-4 border-y py-4 sm:grid-cols-3">
          <div><p className="partner-muted text-sm font-semibold">Dönem Siparişleri</p><p className="partner-display mt-1 text-2xl">{data.summary.orderCount}</p></div>
          <div><p className="partner-muted text-sm font-semibold">Dönem Cirosu</p><p className="partner-display mt-1 text-2xl">{money(data.summary.revenue)}</p></div>
          <div><p className="partner-muted text-sm font-semibold">Dönem Komisyonu</p><p className="partner-display mt-1 text-2xl">{money(data.summary.commissionEarned)}</p></div>
          <p className="partner-muted sm:col-span-3 text-sm">Bu tutarlar seçili tarih aralığına aittir. Bakiye ve ödenen toplam bilgileri Genel Bakış bölümünde tüm zamanlar için gösterilir.</p>
        </section>
      )}

      {loading && !data && <LoadingRows label="Satışlar yükleniyor" />}
      {loading && data && <div aria-live="polite" className="partner-muted text-sm">Satış listesi güncelleniyor</div>}
      {data && data.sales.length > 0 && (
        <div className="space-y-3">
          {data.sales.map((sale) => {
            const status = paymentLabel(sale.paymentStatus, sale.status);
            const isBad = status === "İptal" || status === "İade Edildi" || status === "Başarısız";
            return (
              <article key={sale.id} className="partner-card partner-break min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="partner-break min-w-0 flex-1">
                    <h2 className="partner-break text-sm font-bold">{sale.orderNumber}<span className="partner-muted ml-2 text-sm font-normal">{dateText(sale.createdAt)}</span></h2>
                    <p className="partner-break partner-muted mt-1 text-sm">Müşteri: {sale.customerName} · Kod: {sale.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{money(sale.commission)}</p>
                    <p className="partner-muted mt-1 text-sm">{sale.commissionEstimated ? "Tahmini Komisyon" : "Komisyon"}</p>
                  </div>
                </div>
                <div className="partner-border mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    {sale.items.map((item, index) => (
                      <div key={`${sale.id}-${index}`} className="flex min-w-0 items-center gap-3 py-1.5">
                        <ProductThumbnail src={item.productImage} name={item.productName} />
                        <div className="partner-break min-w-0 flex-1">
                          <p className="partner-break text-sm font-semibold text-neutral-200">{item.productName}</p>
                          <p className="partner-muted mt-1 text-sm">
                            {item.variantDetails && <span>{item.variantDetails} · </span>}
                            <span>× {item.quantity}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className={`partner-status border px-2.5 py-1 text-sm font-bold ${isBad ? "partner-status-muted" : ""}`}>{status}</span>
                </div>
                <p className="partner-break partner-muted mt-2 text-right text-sm">Sipariş Tutarı {money(sale.total)}</p>
              </article>
            );
          })}
        </div>
      )}

      {data && data.sales.length === 0 && !loading && (
        <div className="partner-border border-y px-4 py-12 text-center">
                  <p className="partner-display text-2xl">Satış Bulunamadı</p>
          <p className="partner-muted mt-2 text-sm">{startDate || endDate ? "Bu tarih aralığında satış görünmüyor." : "Henüz satış kaydı oluşmadı."}</p>
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between gap-3">
          <span className="partner-muted text-sm">{data.page}. Sayfa · {data.totalSales} satış</span>
          <div className="flex gap-2">
            <button aria-label="Önceki Sayfa" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="partner-border grid h-11 w-11 place-items-center border disabled:opacity-35"><ChevronLeft size={18} /></button>
            <button aria-label="Sonraki Sayfa" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="partner-border grid h-11 w-11 place-items-center border disabled:opacity-35"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
