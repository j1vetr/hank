import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, LoaderCircle, LockKeyhole, RefreshCw, ScanSearch, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VariantSkuStatus = "current" | "candidate" | "custom";

type VariantSkuRow = {
  id: string;
  size: string | null;
  color: string | null;
  currentSku: string | null;
  suggestedSku: string | null;
  status: VariantSkuStatus;
  needsUpdate: boolean;
};

type SkuCheck = {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variants: VariantSkuRow[];
};

type RepairResponse = {
  updatedCount: number;
  check: SkuCheck;
};

type RequestError = Error & { status?: number };

export interface VariantSkuCheckDialogProps {
  productId: string;
  onClose: () => void;
  onUpdated: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
          : response.status === 409
            ? "Ürün kodu veya varyantlar değişmiş. Güncel listeyi kontrol edip yeniden deneyin."
            : "İşlem tamamlanamadı. Lütfen yeniden deneyin.",
    ) as RequestError;
    error.status = response.status;
    throw error;
  }
  return body as T;
}

export default function VariantSkuCheckDialog({
  productId,
  onClose,
  onUpdated,
}: VariantSkuCheckDialogProps) {
  const [check, setCheck] = useState<SkuCheck | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<{ message: string; status?: number } | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const requestId = useRef(0);

  const fetchCheck = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    setSubmitError(null);
    setUpdatedCount(null);
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/sku-check`, {
        method: "GET",
        credentials: "include",
      });
      const result = await readResponse<SkuCheck>(response);
      if (currentRequest !== requestId.current) return;
      setCheck(result);
      setSelectedIds(new Set(result.variants.filter((row) => row.status === "candidate" && row.needsUpdate).map((row) => row.id)));
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setLoadError(getErrorMessage(error, "Varyant kodları yüklenemedi."));
      setCheck(null);
      setSelectedIds(new Set());
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchCheck();
    return () => {
      requestId.current += 1;
    };
  }, [fetchCheck]);

  const candidates = useMemo(
    () => check?.variants.filter((row) => row.status === "candidate" && row.needsUpdate) ?? [],
    [check],
  );
  const currentCount = check?.variants.filter((row) => row.status === "current").length ?? 0;
  const customCount = check?.variants.filter((row) => row.status === "custom").length ?? 0;
  const selectedCount = candidates.filter((row) => selectedIds.has(row.id)).length;

  const toggleRow = (row: VariantSkuRow) => {
    if (row.status !== "candidate" || !row.needsUpdate || pending) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
    setSubmitError(null);
    setUpdatedCount(null);
  };

  const toggleAll = () => {
    setSelectedIds((previous) =>
      candidates.every((row) => previous.has(row.id))
        ? new Set()
        : new Set(candidates.map((row) => row.id)),
    );
    setSubmitError(null);
    setUpdatedCount(null);
  };

  const submitRepairs = async () => {
    if (!check || selectedCount === 0 || pending) return;
    setPending(true);
    setSubmitError(null);
    setUpdatedCount(null);
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/repair-skus`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedProductSku: check.product.sku,
          variants: candidates
            .filter((row) => selectedIds.has(row.id))
            .map((row) => ({
              id: row.id,
              expectedCurrentSku: row.currentSku,
              expectedSuggestedSku: row.suggestedSku,
            })),
        }),
      });
      const result = await readResponse<RepairResponse>(response);
      setCheck(result.check);
      setSelectedIds(new Set(result.check.variants.filter((row) => row.status === "candidate" && row.needsUpdate).map((row) => row.id)));
      setUpdatedCount(result.updatedCount);
      onUpdated();
    } catch (error) {
      const requestError = error as RequestError;
      setSubmitError({
        message: getErrorMessage(error, "Kodlar güncellenemedi. Hiçbir değişiklik başarılı olarak gösterilmedi."),
        status: requestError?.status,
      });
    } finally {
      setPending(false);
    }
  };

  const allCandidatesSelected = candidates.length > 0 && candidates.every((row) => selectedIds.has(row.id));
  const hasVariants = (check?.variants.length ?? 0) > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent
        aria-describedby="sku-check-description"
        className="max-h-[92dvh] w-[calc(100%-1.25rem)] max-w-3xl gap-0 overflow-hidden border-zinc-700 bg-zinc-950 p-0 text-zinc-100 shadow-2xl shadow-black/50 sm:w-[calc(100%-2rem)] sm:rounded-xl"
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b border-zinc-800 px-5 py-5 pr-14 text-left sm:px-7">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            Ürün kodu kontrolü
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            Varyant kodlarını karşılaştır
          </DialogTitle>
          <DialogDescription id="sku-check-description" className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Öneriler beden ve renk eklerinden çıkarılır. Güncellemeden önce her kodu gözden geçirin. Özel kod kullanıyorsanız ilgili önerinin seçimini kaldırın. Tanınmayan kodlar korunur.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          {loading ? (
            <div className="space-y-4" aria-label="Varyant kodları yükleniyor" aria-live="polite">
              <div className="h-16 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/80" />
              <div className="h-12 animate-pulse rounded-lg bg-zinc-900/80" />
              <div className="h-12 animate-pulse rounded-lg bg-zinc-900/80" />
              <div className="h-12 animate-pulse rounded-lg bg-zinc-900/80" />
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5" role="alert">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-medium text-red-200">Kod kontrolü açılamadı</h3>
                  <p className="mt-1 break-words text-sm leading-6 text-red-100/80">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchCheck()}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-red-300/30 px-3 text-sm font-medium text-red-100 transition-colors hover:bg-red-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Yeniden dene
                  </button>
                </div>
              </div>
            </div>
          ) : check ? (
            <div className="space-y-5">
              <section className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Ürün</p>
                  <p className="mt-1 break-words font-medium text-zinc-100">{check.product.name}</p>
                  <p className="mt-1 break-all font-mono text-sm text-violet-300">{check.product.sku || "Ürün kodu yok"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm sm:self-center">
                  <span className="font-mono text-lg font-semibold tabular-nums text-zinc-100">{check.variants.length}</span>
                  <span className="text-zinc-400">varyant</span>
                </div>
              </section>

              {submitError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4" role="alert">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-medium text-red-200">
                        {submitError.status === 409 ? "Kayıt güncel değil" : "Kodlar güncellenemedi"}
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-red-100/80">{submitError.message}</p>
                      {submitError.status === 409 && (
                        <button
                          type="button"
                          onClick={() => void fetchCheck()}
                          className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-red-300/30 px-3 text-sm text-red-100 hover:bg-red-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          Listeyi yenile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {updatedCount !== null && (
                <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4" role="status" aria-live="polite">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  <p className="text-sm leading-6 text-emerald-100">
                    {updatedCount} varyant kodu güncellendi. Son kontrol sonucu aşağıda.
                  </p>
                </div>
              )}

              {!hasVariants ? (
                <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 px-5 py-10 text-center">
                  <p className="font-medium text-zinc-200">Bu üründe varyant yok</p>
                  <p className="mt-1 text-sm text-zinc-500">Kontrol edilecek varyant kodu bulunamadı.</p>
                </div>
              ) : (
                <>
                  {candidates.length === 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-emerald-100">Güncelleme önerisi bulunmuyor</p>
                        <p className="mt-1 text-sm leading-5 text-zinc-400">
                          {currentCount} kod güncel{customCount > 0 ? `, ${customCount} özel veya belirsiz kod korunuyor` : ""}.
                        </p>
                      </div>
                    </div>
                  )}

                  {candidates.length > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Gözden geçirilecek kodlar</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          Öneriler yalnızca beden ve renk eklerinden tahmin edilir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAll}
                        disabled={pending}
                        className="min-h-9 self-start rounded-md px-2 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-400/10 hover:text-violet-200 disabled:opacity-50 sm:self-auto"
                      >
                        {allCandidatesSelected ? "Seçimi kaldır" : "Tümünü seç"}
                      </button>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-lg border border-zinc-800">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 bg-zinc-900 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-4">
                      <span>Mevcut kod</span>
                      <span>Önerilen kod</span>
                      <span className="hidden sm:block">Durum</span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {check.variants.map((row) => {
                        const isCandidate = row.status === "candidate" && row.needsUpdate;
                        const isSelected = selectedIds.has(row.id);
                        const isCustom = row.status === "custom";
                        return (
                          <div
                            key={row.id}
                            className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-2 px-3 py-3.5 transition-colors sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:px-4 ${
                              isCandidate && isSelected ? "bg-violet-400/[0.055]" : "bg-zinc-950"
                            }`}
                          >
                            <div className="flex min-w-0 items-start gap-2">
                              {isCandidate ? (
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={isSelected}
                                  aria-label={`${isSelected ? "Seçimi kaldır" : "Seç"} ${row.size ?? ""} ${row.color ?? ""} varyantı`}
                                  onClick={() => toggleRow(row)}
                                  disabled={pending}
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                                    isSelected
                                      ? "border-violet-300 bg-violet-300 text-zinc-950"
                                      : "border-zinc-600 bg-zinc-900 text-transparent hover:border-violet-300"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
                                </button>
                              ) : (
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-zinc-600">
                                  {isCustom ? <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
                                </span>
                              )}
                              <div className="min-w-0">
                                <code className="block break-all font-mono text-xs leading-5 text-zinc-200 sm:text-sm">
                                  {row.currentSku || "Kod yok"}
                                </code>
                                <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                                  {[row.size, row.color].filter(Boolean).join(" / ") || "Varyant"}
                                </p>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <code className={`block break-all font-mono text-xs leading-5 sm:text-sm ${isCandidate ? "text-violet-200" : "text-zinc-500"}`}>
                                {row.suggestedSku || (isCustom ? "Korunuyor" : row.currentSku || "Kod yok")}
                              </code>
                              <p className="mt-1 text-[11px] leading-4 text-zinc-600 sm:hidden">
                                {isCustom ? "Özel kod, değiştirilmeyecek" : isCandidate ? "Önerilen kod" : "Kod doğru"}
                              </p>
                            </div>
                            <div className="col-span-2 flex min-h-5 items-center sm:col-span-1 sm:justify-end">
                              {isCustom ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-amber-300/80">
                                  <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                                  Özel, korunuyor
                                </span>
                              ) : isCandidate ? (
                                <span className={`rounded px-2 py-1 text-[11px] font-medium ${isSelected ? "bg-violet-400/15 text-violet-200" : "bg-zinc-800 text-zinc-400"}`}>
                                  {isSelected ? "Seçildi" : "Öneri"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  Doğru
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {currentCount > 0 && (
                    <p className="text-xs text-zinc-500">
                      {currentCount} kod zaten doğru. Özel kodlar seçilemez ve değiştirilmez.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 bg-zinc-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="min-h-5 text-xs text-zinc-500" aria-live="polite">
            {candidates.length > 0 && !loading && !loadError
              ? `${selectedCount} / ${candidates.length} öneri seçildi`
              : ""}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4 sm:hidden" aria-hidden="true" />
              Kapat
            </button>
            <button
              type="button"
              onClick={() => void submitRepairs()}
              disabled={pending || loading || !!loadError || selectedCount === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-violet-300 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {pending ? "Güncelleniyor" : "Seçilen kodları güncelle"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
