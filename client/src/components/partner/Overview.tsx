import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, Clock3, Wallet } from "lucide-react";
import type { PartnerProfile } from "./partner-api";
import { commissionText, dashboardUrl, dateText, money, request } from "./partner-api";
import type { PartnerDashboard } from "./partner-api";
import { CopyCode, ErrorBox, LoadingRows } from "./PartnerPrimitives";

function OverviewStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="partner-border border-t-2 pt-4">
      <p className="partner-muted text-[11px] font-semibold">{label}</p>
      <p className="partner-display mt-2 text-3xl leading-none sm:text-4xl">{value}</p>
      <p className="partner-muted mt-2 text-[11px]">{detail}</p>
    </article>
  );
}

export default function Overview({ profile, goTo }: { profile: PartnerProfile; goTo: (section: string) => void }) {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request<PartnerDashboard>(dashboardUrl({ page: 1 })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Özet yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const summary = data?.summary;
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-6 bg-black px-5 py-6 text-white sm:flex-row sm:items-end sm:px-8 sm:py-8">
        <div>
          <p className="partner-muted text-[10px] font-bold uppercase tracking-[0.2em]">PARTNER PERFORMANSI</p>
          <h1 className="partner-display mt-2 text-4xl leading-none sm:text-5xl">Genel Bakış</h1>
          <p className="partner-muted mt-2 text-sm">Merhaba, {profile.name}</p>
          <p className="partner-muted mt-3 text-sm">Komisyon oranı <strong className="ml-1 text-white">{commissionText(profile)}</strong></p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="partner-border border px-4 py-2.5">
            <span className="partner-muted mr-3 text-[9px] font-bold tracking-[0.18em]">PARTNER KODUN</span>
            <strong className="font-mono text-sm">{profile.code}</strong>
          </div>
          <CopyCode code={profile.code} />
        </div>
      </section>

      {error && <ErrorBox onRetry={() => void load()}>{error}</ErrorBox>}
      {loading && !data && <LoadingRows label="Özet yükleniyor" />}
      {data && summary && (
        <>
          <section aria-label="Bakiye özeti" className="partner-border grid gap-6 border-b pb-7 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStat label="Kullanılabilir bakiye" value={money(summary.availableBalance)} detail="Yeni ödeme talebi için" />
            <OverviewStat label="Ayırılmış bakiye" value={money(summary.reservedBalance)} detail="Bekleyen ödeme talepleri" />
            <OverviewStat label="Toplam kazanılan" value={money(summary.commissionEarned)} detail={`${summary.orderCount} sipariş, tüm zamanlar`} />
            <OverviewStat label="Ödenen toplam" value={money(summary.paidTotal)} detail="Tamamlanan ödemeler" />
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div><p className="partner-muted text-[10px] font-bold uppercase tracking-[0.18em]">SON HAREKETLER</p><h2 className="partner-display text-3xl uppercase">Son satışlar</h2></div>
                <button type="button" onClick={() => goTo("sales")} className="inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-4">Tüm satışlar<ArrowRight size={14} /></button>
              </div>
              {data.sales.length ? (
                <div className="partner-border divide-y border-y">
                  {data.sales.slice(0, 5).map((sale) => (
                    <article key={sale.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{sale.orderNumber}</p>
                        <p className="partner-muted mt-1 text-xs">{dateText(sale.createdAt)} · {sale.customerName}</p>
                      </div>
                      <div className="text-right"><p className="text-sm font-bold">{money(sale.commission)}</p><p className="partner-muted mt-1 text-[10px]">Komisyon</p></div>
                    </article>
                  ))}
                </div>
              ) : <p className="partner-border partner-muted border-y py-8 text-sm">Henüz satış kaydı yok.</p>}
            </div>

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-1">
              <section>
                <div className="mb-4 flex items-end justify-between gap-2"><div><p className="partner-muted text-[10px] font-bold uppercase tracking-[0.18em]">AYLIK ÖZET</p><h2 className="partner-display text-3xl uppercase">Dönem performansı</h2></div></div>
                {data.monthly.length ? (
                  <div className="partner-border divide-y border-y">
                    {data.monthly.slice(0, 4).map((item) => (
                      <div key={item.month} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div><p className="font-semibold">{dateText(`${item.month}-01`, { month: "long", year: "numeric" })}</p><p className="partner-muted mt-1 text-xs">{item.count} sipariş · {money(item.revenue)} ciro</p></div>
                        <strong>{money(item.commission)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="partner-border partner-muted border-y py-6 text-sm">Aylık performans kaydı bulunmuyor.</p>}
              </section>
              <section>
                <div className="mb-4"><p className="partner-muted text-[10px] font-bold uppercase tracking-[0.18em]">ÜRÜN TERCİHLERİ</p><h2 className="partner-display text-3xl uppercase">Öne çıkan ürünler</h2></div>
                {data.topProducts.length ? (
                  <div className="partner-border divide-y border-y">
                    {data.topProducts.slice(0, 4).map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="min-w-0 truncate font-semibold">{String(index + 1).padStart(2, "0")} <span className="ml-2">{item.name}</span></span>
                        <span className="partner-muted shrink-0 text-xs">{item.quantity} adet</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="partner-border partner-muted border-y py-6 text-sm">Ürün verisi henüz oluşmadı.</p>}
              </section>
            </div>
          </section>

          <section className="partner-border flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
            <p className="partner-muted text-xs">Bakiye tutarları tüm zamanları kapsar. Satış dönemi seçildiğinde yalnızca dönem ciro ve komisyonu değişir.</p>
            <button type="button" onClick={() => goTo("withdrawals")} className="partner-primary inline-flex w-fit items-center gap-2 px-4 py-3 text-xs font-bold"><Wallet size={15} />Ödeme taleplerine git<ArrowUpRight size={14} /></button>
          </section>
        </>
      )}
      {loading && data && <div className="partner-muted flex items-center gap-2 text-xs"><Clock3 size={14} />Özet yenileniyor</div>}
    </div>
  );
}
