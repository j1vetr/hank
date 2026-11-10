import type { ReactNode } from "react";
import { CircleAlert, Copy, Check } from "lucide-react";
import { useState } from "react";

export function ErrorBox({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="partner-error flex items-start justify-between gap-3 border p-3 text-sm">
      <span className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{children}</span>
      {onRetry && <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-4">Yeniden Dene</button>}
    </div>
  );
}

export function LoadingRows({ label = "Yükleniyor" }: { label?: string }) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((item) => <div key={item} className="partner-skeleton h-[4.5rem] rounded-sm" />)}
    </div>
  );
}

export function ProductThumbnail({ src, name }: { src: string | null | undefined; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const candidate = src?.trim();
  const safeSrc = candidate && !candidate.includes("\\") && (
    (candidate.startsWith("/") && !candidate.startsWith("//")) || /^https?:\/\/[^/]/i.test(candidate)
  ) ? candidate : null;
  if (!safeSrc || failedSrc === safeSrc) {
    return (
      <span role="img" aria-label={`${name} görseli yok`} className="grid h-14 w-14 shrink-0 place-items-center bg-neutral-800 px-1 text-center text-sm leading-tight text-neutral-300">
        Görsel Yok
      </span>
    );
  }
  return <img src={safeSrc} alt={name} loading="lazy" decoding="async" width={56} height={56} onError={() => setFailedSrc(safeSrc)} className="h-14 w-14 shrink-0 bg-neutral-900 object-contain" />;
}

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const copy = async () => {
    setError("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Panoya erişilemiyor.");
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Kod kopyalanamadı. Kodu seçip kendin kopyalayabilirsin.");
    }
  };
  return (
    <div>
      <button type="button" aria-label="Partner Kodunu Kopyala" onClick={() => void copy()} className="inline-flex min-h-11 items-center gap-2 border border-white/50 px-3 py-2 text-sm font-bold text-white hover:bg-white hover:text-black">
        {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Kopyalandı" : "Kodu Kopyala"}
      </button>
      <span role="status" className="sr-only">{copied ? "Kopyalandı" : ""}</span>
      {error && <p role="alert" className="partner-break mt-2 max-w-48 text-sm text-white">{error}</p>}
    </div>
  );
}
