import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

type InvoiceStatusName =
  | "not_sent"
  | "sending"
  | "sent"
  | "failed"
  | "uncertain"
  | "legacy";

type InvoiceStatus = {
  status: InvoiceStatusName;
  guid: string | null;
  url: string | null;
  error: string | null;
  attemptedAt: string | null;
  sentAt: string | null;
};

type InvoiceTransferPanelProps = {
  orderId: string;
};

const statusCopy: Record<InvoiceStatusName, string> = {
  not_sent: "Henüz gönderilmedi",
  sending: "Gönderim sürüyor",
  sent: "Gönderildi",
  failed: "Gönderim başarısız",
  uncertain: "Sonuç belirsiz",
  legacy: "Eski kayıt, takip dışı",
};

const statusStyles: Record<InvoiceStatusName, string> = {
  not_sent: "border-zinc-700 bg-zinc-800/70 text-zinc-200",
  sending: "border-sky-800 bg-sky-950/50 text-sky-200",
  sent: "border-emerald-800 bg-emerald-950/50 text-emerald-200",
  failed: "border-red-900 bg-red-950/40 text-red-200",
  uncertain: "border-amber-800 bg-amber-950/40 text-amber-200",
  legacy: "border-orange-900 bg-orange-950/40 text-orange-200",
};

function safeInvoiceUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InvoiceStatus>;
  return (
    ["not_sent", "sending", "sent", "failed", "uncertain", "legacy"].includes(
      candidate.status ?? "",
    ) &&
    (candidate.guid === null || typeof candidate.guid === "string") &&
    (candidate.url === null || typeof candidate.url === "string") &&
    (candidate.error === null || typeof candidate.error === "string") &&
    (candidate.attemptedAt === null ||
      typeof candidate.attemptedAt === "string") &&
    (candidate.sentAt === null || typeof candidate.sentAt === "string")
  );
}

export default function InvoiceTransferPanel({
  orderId,
}: InvoiceTransferPanelProps) {
  const [invoice, setInvoice] = useState<InvoiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);

  const refreshStatus = useCallback(
    async (manual = false): Promise<InvoiceStatus | null> => {
      if (manual) setIsRefreshing(true);
      try {
        const response = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/invoice-status`,
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error("Fatura durumu alınamadı. Yeniden deneyin.");
        }
        const body: unknown = await response.json();
        if (!isInvoiceStatus(body)) {
          throw new Error("Fatura durumu beklenen biçimde alınamadı.");
        }

        setInvoice(body);
        setLoadError(null);
        setActionMessage(null);
        setIsLoading(false);
        return body;
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Fatura durumu alınamadı. Yeniden deneyin.",
        );
        setIsLoading(false);
        return null;
      } finally {
        if (manual) setIsRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    setIsLoading(true);
    setInvoice(null);
    setLoadError(null);
    setActionMessage(null);
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (invoice?.status !== "sending") return;
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [invoice?.status, refreshStatus]);

  const handleSend = async () => {
    if (
      isSubmitting ||
      !invoice ||
      !["not_sent", "failed"].includes(invoice.status)
    ) {
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);
    let postMessage: { text: string; success: boolean } | null = null;

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/send-invoice`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      let body: Record<string, unknown> = {};
      try {
        const parsed: unknown = await response.json();
        if (parsed && typeof parsed === "object") {
          body = parsed as Record<string, unknown>;
        }
      } catch {
        body = {};
      }

      if (response.ok && body.success === true) {
        postMessage = {
          text:
            typeof body.message === "string"
              ? body.message
              : "Fatura aktarımı başarıyla tamamlandı.",
          success: true,
        };
      } else {
        postMessage = {
          text:
            (typeof body.error === "string" && body.error) ||
            (typeof body.message === "string" && body.message) ||
            "Fatura aktarımı tamamlanamadı. Durum yeniden kontrol edildi.",
          success: false,
        };
      }
    } catch {
      postMessage = {
        text: "İstek yanıt vermedi. Güncel durum yeniden kontrol edildi.",
        success: false,
      };
    } finally {
      const refreshed = await refreshStatus();
      if (postMessage && refreshed && !refreshed.error) {
        setActionMessage(postMessage);
      } else if (postMessage && !refreshed) {
        setActionMessage(postMessage);
      }
      setIsSubmitting(false);
    }
  };

  const buttonAllowed =
    invoice?.status === "not_sent" || invoice?.status === "failed";
  const safeUrl = safeInvoiceUrl(invoice?.url ?? null);

  return (
    <section
      aria-labelledby="invoice-transfer-title"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-zinc-300"
          />
          <h3
            id="invoice-transfer-title"
            className="text-lg font-semibold text-white"
          >
            BizimHesap Fatura
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void refreshStatus(true)}
          disabled={isLoading || isRefreshing || isSubmitting}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Fatura durumunu yenile"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Yenile
        </button>
      </div>

      {isLoading ? (
        <div
          className="space-y-3"
          role="status"
          aria-label="Fatura durumu yükleniyor"
        >
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : loadError && !invoice ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-900/80 bg-red-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex min-w-0 items-start gap-2 text-sm text-red-200">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="break-words">{loadError}</span>
          </p>
          <button
            type="button"
            onClick={() => void refreshStatus(true)}
            disabled={isRefreshing}
            className="shrink-0 rounded-md border border-red-800 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-950 disabled:opacity-50"
          >
            Yeniden dene
          </button>
        </div>
      ) : invoice ? (
        <div className="space-y-4">
          {loadError && (
            <p
              role="alert"
              className="break-words rounded-lg border border-red-900/80 bg-red-950/30 px-3 py-2 text-sm text-red-200"
            >
              Durum yenilenemedi: {loadError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span
              role="status"
              aria-label={`Fatura durumu: ${statusCopy[invoice.status]}`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusStyles[invoice.status]}`}
            >
              {invoice.status === "sending" ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : invoice.status === "sent" ? (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              ) : invoice.status === "uncertain" ||
                invoice.status === "legacy" ? (
                <ShieldAlert aria-hidden="true" className="h-4 w-4" />
              ) : invoice.status === "failed" ? (
                <AlertCircle aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Clock3 aria-hidden="true" className="h-4 w-4" />
              )}
              {statusCopy[invoice.status]}
            </span>
            {invoice.status === "sending" && (
              <span className="text-sm text-zinc-400">
                Durum otomatik olarak 5 saniyede bir yenilenir.
              </span>
            )}
          </div>

          {invoice.status === "uncertain" && (
            <p className="break-words rounded-lg border border-amber-800/80 bg-amber-950/30 p-3 text-sm leading-relaxed text-amber-100">
              Aktarım sonucu kesinleşmedi. Yeniden göndermeden önce BizimHesap
              üzerinden faturayı kontrol edin.
            </p>
          )}
          {invoice.status === "legacy" && (
            <p className="break-words rounded-lg border border-orange-900/80 bg-orange-950/25 p-3 text-sm leading-relaxed text-orange-100">
              Önceki faturalar takip sistemine kaydedilmedi. Yeniden işlem
              yapmadan önce BizimHesap üzerinden kontrol edin.
            </p>
          )}

          {invoice.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-900/70 bg-red-950/25 p-3"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                Kayıtlı hata
              </p>
              <p className="break-words text-sm leading-relaxed text-red-100">
                {invoice.error}
              </p>
            </div>
          )}

          <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-zinc-500">
                Son deneme
              </dt>
              <dd className="mt-1 break-words text-sm text-zinc-200">
                {formatDate(invoice.attemptedAt) ?? "Kayıt yok"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-zinc-500">
                Gönderim tarihi
              </dt>
              <dd className="mt-1 break-words text-sm text-zinc-200">
                {formatDate(invoice.sentAt) ?? "Kayıt yok"}
              </dd>
            </div>
            {invoice.guid && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">
                  BizimHesap işlem kimliği
                </dt>
                <dd className="mt-1 break-all font-mono text-sm text-zinc-300">
                  {invoice.guid}
                </dd>
              </div>
            )}
            {safeUrl && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">
                  Fatura bağlantısı
                </dt>
                <dd className="mt-1 min-w-0">
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-start gap-1.5 break-all text-sm text-emerald-300 underline decoration-emerald-800 underline-offset-4 hover:text-emerald-200"
                  >
                    <span className="break-all">{safeUrl}</span>
                    <ExternalLink
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    />
                    <span className="sr-only">yeni sekmede açılır</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {actionMessage && (
            <p
              role={actionMessage.success ? "status" : "alert"}
              className={`break-words text-sm ${
                actionMessage.success ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {actionMessage.text}
            </p>
          )}

          {buttonAllowed && (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSubmitting || isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <FileText aria-hidden="true" className="h-4 w-4" />
                  {invoice.status === "failed" ? "Yeniden dene" : "Fatura gönder"}
                </>
              )}
            </button>
          )}
        </div>
      ) : null}

      <p className="mt-4 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-500">
        Bu işlem yalnızca fatura aktarımını yönetir. Tahsilat veya ödeme kaydı
        entegrasyonu değildir.
      </p>
    </section>
  );
}
