import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Square,
  StopCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  runBulkSkuRepair,
  isBulkSkuCheck,
  type BulkSkuCheck,
  type BulkSkuRepairOutcome,
  type BulkSkuSelection,
  type SkuProductCheck,
  type SkuCheckVariant,
} from "@/lib/bulkSkuRepair";

type OutcomeWithName = BulkSkuRepairOutcome & { productName: string };

export interface BulkVariantSkuCheckDialogProps {
  onClose: () => void;
  onUpdated: () => void;
}

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Kontrol tamamlanamadı. Yeniden deneyin.";
}

export default function BulkVariantSkuCheckDialog({
  onClose,
  onUpdated,
}: BulkVariantSkuCheckDialogProps) {
  const [check, setCheck] = useState<BulkSkuCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [outcomes, setOutcomes] = useState<OutcomeWithName[]>([]);
  const requestId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const updatedNotified = useRef(false);
  const runningRef = useRef(false);

  const fetchCheck = useCallback(async () => {
    if (runningRef.current) return;
    const request = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    setCheck(null);
    setSelectedIds(new Set());
    setConfirmed(false);
    setHasRun(false);
    setOutcomes([]);
    setStopRequested(false);
    setCurrentProductId(null);
    updatedNotified.current = false;
    try {
      const response = await fetch("/api/admin/variant-skus/check", {
        method: "GET",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof body?.message === "string"
            ? body.message
            : typeof body?.error === "string"
              ? body.error
              : "Stok kodları kontrol edilemedi.",
        );
      }
      if (request !== requestId.current) return;
      if (!isBulkSkuCheck(body)) throw new Error("Katalog kontrol yanıtı doğrulanamadı. Yeniden deneyin.");
      const result = body;
      setCheck(result);
      setSelectedIds(new Set(
        result.products.flatMap((product) =>
          product.variants
            .filter((variant) => variant.status === "candidate" && variant.needsUpdate)
            .map((variant) => variant.id),
        ),
      ));
    } catch (error) {
      if (request !== requestId.current) return;
      setLoadError(errorText(error));
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCheck();
    return () => {
      requestId.current += 1;
      controllerRef.current?.abort();
    };
  }, [fetchCheck]);

  const candidates = useMemo(
    () => check?.products.flatMap((product) =>
      product.variants
        .filter((variant) => variant.status === "candidate" && variant.needsUpdate)
        .map((variant) => ({ product, variant })),
    ) ?? [],
    [check],
  );
  const selectedCount = candidates.filter(({ variant }) => selectedIds.has(variant.id)).length;
  const allSelected = candidates.length > 0 && selectedCount === candidates.length;
  const groupedSelectedCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const { product, variant } of candidates) {
      if (selectedIds.has(variant.id)) map.set(product.product.id, (map.get(product.product.id) ?? 0) + 1);
    }
    return map;
  }, [candidates, selectedIds]);
  const currentProduct = check?.products.find((product) => product.product.id === currentProductId);
  const counts = useMemo(() => ({
    updatedProducts: outcomes.filter((outcome) => outcome.status === "updated").length,
    updatedVariants: outcomes.reduce((sum, outcome) => sum + outcome.updatedCount, 0),
    failed: outcomes.filter((outcome) => outcome.status === "failed").length,
    uncertain: outcomes.filter((outcome) => outcome.status === "uncertain").length,
    skipped: outcomes.filter((outcome) => outcome.status === "skipped").length,
  }), [outcomes]);

  const toggleVariant = (variant: SkuCheckVariant) => {
    if (running || hasRun) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(variant.id)) next.delete(variant.id);
      else next.add(variant.id);
      return next;
    });
    setConfirmed(false);
  };

  const toggleAll = () => {
    if (running || hasRun) return;
    setSelectedIds(allSelected ? new Set() : new Set(candidates.map(({ variant }) => variant.id)));
    setConfirmed(false);
  };

  const startRepair = async () => {
    if (!check || selectedCount === 0 || !confirmed || runningRef.current || running || hasRun) return;
    const selectedByProduct = new Map<string, SkuProductCheck>();
    const chosen = new Map<string, SkuCheckVariant[]>();
    for (const { product, variant } of candidates) {
      if (!selectedIds.has(variant.id)) continue;
      selectedByProduct.set(product.product.id, product);
      chosen.set(product.product.id, [...(chosen.get(product.product.id) ?? []), variant]);
    }
    const selections: BulkSkuSelection[] = Array.from(chosen.entries()).map(([productId, variants]) => {
      const product = selectedByProduct.get(productId)!;
      return {
        productId,
        expectedProductSku: product.product.sku ?? "",
        variants: variants.map((variant) => ({
          id: variant.id,
          expectedCurrentSku: variant.currentSku,
          expectedSuggestedSku: variant.suggestedSku ?? "",
        })),
      };
    });
    const productNames = new Map(check.products.map((product) => [product.product.id, product.product.name]));
    const controller = new AbortController();
    controllerRef.current = controller;
    runningRef.current = true;
    setRunning(true);
    setHasRun(true);
    setStopRequested(false);
    setOutcomes([]);
    setProgress({ index: 0, total: selections.length });
    updatedNotified.current = false;
    try {
      const results = await runBulkSkuRepair(selections, {
        signal: controller.signal,
        onStart: (productId, index, total) => {
          setCurrentProductId(productId);
          setProgress({ index: index + 1, total });
        },
        onResult: (result) => {
          setOutcomes((previous) => [
            ...previous,
            { ...result, productName: productNames.get(result.productId) ?? "Ürün" },
          ]);
        },
      });
      if (results.some((result) => result.status === "updated" && result.updatedCount > 0) && !updatedNotified.current) {
        updatedNotified.current = true;
        onUpdated();
      }
    } finally {
      controllerRef.current = null;
      runningRef.current = false;
      setCurrentProductId(null);
      setRunning(false);
    }
  };

  const requestStop = () => {
    if (!running || !controllerRef.current) return;
    controllerRef.current.abort();
    setStopRequested(true);
  };

  const canClose = !running;
  const onDialogChange = (open: boolean) => {
    if (!open && canClose && !runningRef.current) onClose();
  };

  const productCandidateCount = (product: SkuProductCheck) =>
    product.variants.filter((variant) => variant.status === "candidate" && variant.needsUpdate).length;

  return (
    <Dialog open onOpenChange={onDialogChange}>
      <DialogContent
        aria-describedby="bulk-sku-description"
        className="flex h-[94dvh] max-h-[94dvh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden border-[#344847] bg-[#172625] p-0 text-[#f2f0e7] shadow-2xl shadow-[#071311]/60 sm:w-[calc(100%-2rem)] sm:rounded-xl"
        onEscapeKeyDown={(event) => {
          if (!canClose) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!canClose) event.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 border-b border-[#344847] bg-[#1c302e] px-5 py-5 pr-14 text-left sm:px-7 sm:py-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b778]">
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            HANK / katalog kontrolü
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-[#faf8ee] sm:text-2xl">
            Varyant stok kodlarını topluca incele
          </DialogTitle>
          <DialogDescription id="bulk-sku-description" className="mt-2 max-w-3xl text-sm leading-6 text-[#b2c1b8]">
            Etkin olmayanlar dahil tüm ürünler, arama filtresinden bağımsız olarak kontrol edilir. Güncellemeler ürün bazında ve sırayla yapılır. Her ürünün kodlarını gözden geçirin, sonra açıkça onaylayın.
          </DialogDescription>
        </DialogHeader>

        <div data-testid="bulk-sku-scroll-area" className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-5 sm:px-7">
          {loading ? (
            <div className="space-y-4" aria-label="Stok kodları kontrol ediliyor" aria-live="polite">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-[72px] animate-pulse rounded-lg border border-[#344847] bg-[#203330]" />
                ))}
              </div>
              <div className="h-24 animate-pulse rounded-lg border border-[#344847] bg-[#203330]" />
              <div className="h-36 animate-pulse rounded-lg border border-[#344847] bg-[#203330]" />
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-[#bd7462]/40 bg-[#6b382f]/20 p-5" role="alert">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#e5a092]" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-medium text-[#f3c6ba]">Katalog kontrol edilemedi</h3>
                  <p className="mt-1 break-words text-sm leading-6 text-[#e8c7be]">{loadError}</p>
                  <button type="button" onClick={() => void fetchCheck()} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d89a8d]/40 px-3 text-sm font-medium text-[#f3d7ce] hover:bg-[#d89a8d]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d89a8d]">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Kontrolü yeniden çalıştır
                  </button>
                </div>
              </div>
            </div>
          ) : check ? (
            <div className="space-y-5">
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Katalog kontrol özeti">
                {[
                  { label: "Kontrol edilen ürün", value: check.checkedProducts, tone: "text-[#f4f0e2]" },
                  { label: "Toplam varyant", value: check.totalVariants, tone: "text-[#f4f0e2]" },
                  { label: "Kod önerisi", value: check.candidateCount, tone: "text-[#e6c37f]" },
                  { label: "Güncel kod", value: check.currentCount, tone: "text-[#9fc4a3]" },
                  { label: "Özel kod", value: check.customCount, tone: "text-[#d9a58b]" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#344847] bg-[#203330] px-3 py-3 sm:px-4">
                    <p className="text-[10px] font-semibold leading-4 tracking-[0.12em] text-[#92a79b]">{item.label.toLocaleUpperCase("tr-TR")}</p>
                    <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-[#9e8051]/35 bg-[#8a6c3c]/10 p-4">
                  <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#d8b778]" aria-hidden="true" />
                  <p className="text-xs leading-5 text-[#d4c7a8]">
                    <strong className="font-semibold text-[#ead6ac]">{check.missingSkuProducts} üründe temel stok kodu yok.</strong> Bu ürünler için önce ürün stok kodunu kaydedin.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-[#344847] bg-[#203330]/80 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9fc4a3]" aria-hidden="true" />
                  <p className="text-xs leading-5 text-[#b2c1b8]">
                    Öneriler beden ve renk eklerini korur. Özel olarak işaretlenen satırlar değişmez. Fiyat, stok miktarı ve harici fatura bilgileri etkilenmez.
                  </p>
                </div>
              </div>

              {running && (
                <section className="rounded-lg border border-[#d8b778]/35 bg-[#84683b]/10 p-4" role="status" aria-live="polite">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#e2c17e]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#f0dfb7]">
                          Ürün {progress.index} / {progress.total} sırayla işleniyor
                        </p>
                        <p className="mt-1 break-words text-sm text-[#c8b990]">
                          {currentProduct?.product.name ?? "Ürün sonucu bekleniyor"}
                          {stopRequested ? " · Mevcut ürün tamamlanınca duracak" : ""}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={requestStop} disabled={stopRequested} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#d8b778]/40 px-3 text-sm font-medium text-[#f1dfb7] hover:bg-[#d8b778]/10 disabled:cursor-not-allowed disabled:opacity-50">
                      <StopCircle className="h-4 w-4" aria-hidden="true" />
                      {stopRequested ? "Durdurma istendi" : "Sıradaki üründen önce durdur"}
                    </button>
                  </div>
                </section>
              )}

              {hasRun && !running && (
                <section className="rounded-lg border border-[#344847] bg-[#203330] p-4" role="status" aria-live="polite">
                  <div className="flex items-start gap-3">
                    {counts.uncertain > 0
                      ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#e4a294]" aria-hidden="true" />
                      : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9fc4a3]" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#f0eee3]">İşlem sonuçları</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#b2c1b8]">
                        <span>{counts.updatedProducts} ürün güncellendi</span>
                        <span>{counts.updatedVariants} varyant kodu değişti</span>
                        <span>{counts.failed} başarısız</span>
                        <span>{counts.uncertain} sonucu belirsiz</span>
                        <span>{counts.skipped} atlandı</span>
                      </div>
                      {stopRequested && <p className="mt-2 text-xs text-[#d8c79e]">Durdurma isteği işlendi. Devamındaki ürünlere dokunulmadı.</p>}
                      {outcomes.length > 0 && (
                        <ul className="mt-4 space-y-2 border-t border-[#344847] pt-3">
                          {outcomes.map((outcome, index) => (
                            <li key={`${outcome.productId}-${index}`} className="flex flex-col gap-1 text-xs sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="min-w-0 break-words font-medium text-[#e8e8dc]">{outcome.productName}</span>
                              <span className={`min-w-0 break-words leading-5 ${outcome.status === "updated" ? "text-[#a8cba9]" : outcome.status === "skipped" ? "text-[#b2c1b8]" : "text-[#e4a294]"}`}>
                                {outcome.message}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button type="button" onClick={() => void fetchCheck()} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-[#668178]/50 px-3 text-xs font-semibold text-[#d6e0d4] hover:bg-[#668178]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c4aa]">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Yeni kontrol yap
                      </button>
                      <p className="mt-2 text-[11px] leading-5 text-[#92a79b]">Yeni kontrol yapılana kadar bu sonuçlarla yeniden işlem başlatılamaz.</p>
                    </div>
                  </div>
                </section>
              )}

              {check.products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#4a625a] bg-[#203330]/60 px-5 py-12 text-center">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-[#9fc4a3]" aria-hidden="true" />
                  <p className="mt-3 font-medium text-[#e8eee3]">Kontrol edilecek öneri bulunamadı</p>
                  <p className="mt-1 text-sm text-[#92a79b]">Katalogdaki stok kodları uygun görünüyor. Güncel ve özel kod özetleri yukarıda.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#e9e9dd]">Ürün bazında kod karşılaştırması</p>
                      <p className="mt-1 text-xs leading-5 text-[#92a79b]">Her ürün ayrı bir guarded güncelleme olarak işlenir. Varyant ekleri korunur.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAll}
                      disabled={running || hasRun || candidates.length === 0}
                      className="inline-flex min-h-9 self-start items-center gap-2 rounded-md border border-[#668178]/50 px-3 text-xs font-semibold text-[#d4e1d3] transition-colors hover:bg-[#668178]/15 disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
                    >
                      {allSelected ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {allSelected ? "Tüm seçimi kaldır" : "Tüm önerileri seç"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {check.products.map((product) => {
                      const candidateCount = productCandidateCount(product);
                      const productSelected = groupedSelectedCount.get(product.product.id) ?? 0;
                      return (
                        <section key={product.product.id} className="overflow-hidden rounded-lg border border-[#344847] bg-[#1b2b29]">
                          <header className="flex flex-col gap-2 border-b border-[#344847] bg-[#203330] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-[#f0eee3]">{product.product.name}</p>
                              <p className="mt-1 break-all font-mono text-xs text-[#d8b778]">Ürün kodu: {product.product.sku || "Temel kod yok"}</p>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <span className="rounded border border-[#536b60] px-2 py-1 text-[11px] font-medium text-[#c1d0c1]">
                                {product.variants.length} varyant
                              </span>
                              {candidateCount > 0 && <span className="rounded bg-[#a17b3b]/15 px-2 py-1 text-[11px] font-medium text-[#e2c17e]">{productSelected} / {candidateCount} seçili</span>}
                            </div>
                          </header>
                          <div className="hidden grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-[#344847] bg-[#192725] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#82978b] sm:grid sm:px-5">
                            <span>Varyant</span><span>Mevcut kod</span><span>Önerilen kod</span><span>Durum</span>
                          </div>
                          <div className="divide-y divide-[#344847]">
                            {product.variants.map((variant) => {
                              const candidate = variant.status === "candidate" && variant.needsUpdate;
                              const custom = variant.status === "custom";
                              const selected = selectedIds.has(variant.id);
                              const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ") || "Varyant";
                              return (
                                <div key={variant.id} className={`grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-5 ${candidate && selected ? "bg-[#a17b3b]/[0.07]" : ""}`}>
                                  <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
                                    {candidate ? (
                                      <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={selected}
                                        aria-label={`${selected ? "Seçimi kaldır" : "Seç"} ${variantLabel} varyantını`}
                                        onClick={() => toggleVariant(variant)}
                                        disabled={running || hasRun}
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c17e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2b29] ${selected ? "border-[#e2c17e] bg-[#e2c17e] text-[#182522]" : "border-[#71877b] text-transparent hover:border-[#e2c17e]"} disabled:cursor-not-allowed`}
                                      >
                                        {selected && <Check className="h-3 w-3" aria-hidden="true" />}
                                      </button>
                                    ) : (
                                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#82978b]">
                                        {custom ? <LockKeyhole className="h-3.5 w-3.5 text-[#d9a58b]" aria-hidden="true" /> : <Check className="h-3.5 w-3.5 text-[#9fc4a3]" aria-hidden="true" />}
                                      </span>
                                    )}
                                    <span className="break-words text-xs font-medium text-[#dce2d7] sm:text-sm">{variantLabel}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#82978b] sm:hidden">Mevcut</p>
                                    <code className="block break-all font-mono text-xs leading-5 text-[#d8e0d5]">{variant.currentSku || "Kod yok"}</code>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#82978b] sm:hidden">Önerilen</p>
                                    <code className={`block break-all font-mono text-xs leading-5 ${candidate ? "text-[#e8ca8a]" : "text-[#9cad9f]"}`}>
                                      {variant.suggestedSku || (custom ? "Korunuyor" : variant.currentSku || "Kod yok")}
                                    </code>
                                  </div>
                                  <div className="col-span-2 flex items-center sm:col-span-1 sm:justify-end">
                                    {custom ? (
                                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#d9a58b]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Özel, değişmeyecek</span>
                                    ) : candidate ? (
                                      <span className={`rounded px-2 py-1 text-[10px] font-medium ${selected ? "bg-[#a17b3b]/20 text-[#e8ca8a]" : "bg-[#344847] text-[#aab9ad]"}`}>{selected ? "Seçildi" : "Öneri"}</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#9fc4a3]"><Check className="h-3.5 w-3.5" aria-hidden="true" />Güncel</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </>
              )}

              {candidates.length > 0 && !hasRun && (
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${confirmed ? "border-[#9fc4a3]/55 bg-[#6f956e]/10" : "border-[#536b60] bg-[#203330]/70"} ${running ? "cursor-not-allowed opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={running}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#9fc4a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fc4a3]"
                  />
                  <span className="text-xs leading-5 text-[#c5d0c3]">
                    <strong className="font-semibold text-[#e7ebdf]">Seçili kodları güncellemek için onaylıyorum.</strong> Önerileri inceledim. Güncelleme ürünleri sırayla işleyecek ve özel kodları, fiyatları, stok miktarlarını ya da harici fatura bilgilerini değiştirmeyecek.
                  </span>
                </label>
              )}
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#344847] bg-[#172625] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="min-h-5 text-xs text-[#92a79b]" aria-live="polite">
            {check && !loading && !loadError && !hasRun
              ? `${selectedCount} / ${candidates.length} öneri seçildi`
              : running
                ? "Etkin ürün tamamlanana kadar işlem sürer"
                : ""}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={!canClose}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#536b60] px-4 text-sm font-medium text-[#c5d0c3] transition-colors hover:bg-[#263b37] hover:text-[#f2f0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c4aa] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4 sm:hidden" aria-hidden="true" />
              Kapat
            </button>
            {running ? (
              <button type="button" onClick={requestStop} disabled={stopRequested} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#d8b778] px-4 text-sm font-semibold text-[#1e2925] hover:bg-[#e7ca8e] disabled:cursor-not-allowed disabled:opacity-60">
                <StopCircle className="h-4 w-4" aria-hidden="true" />
                {stopRequested ? "Durdurma istendi" : "Sıradaki üründe durdur"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startRepair()}
                disabled={loading || !!loadError || selectedCount === 0 || !confirmed || hasRun}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#d8b778] px-4 text-sm font-semibold text-[#1e2925] transition-colors hover:bg-[#e7ca8e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7ca8e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#172625] disabled:cursor-not-allowed disabled:bg-[#344847] disabled:text-[#82978b]"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {hasRun ? "Yeni kontrol gerekli" : `${selectedCount} varyantı sırayla güncelle`}
              </button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
