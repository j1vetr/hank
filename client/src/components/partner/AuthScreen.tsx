import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { PartnerProfile } from "./partner-api";
import { jsonPost, request } from "./partner-api";
import { ErrorBox } from "./PartnerPrimitives";

type AuthMode = "login" | "lookup" | "reference" | "register";

const fieldClass = "partner-input w-full px-3.5 py-3 text-sm";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (profile: PartnerProfile) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const clearMessages = () => {
    setError("");
    setFieldError("");
  };

  const checkCode = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (!code.trim()) {
      setFieldError("HANK kodunu gir.");
      return;
    }
    setBusy(true);
    try {
      const result = await request<{ next: "register" | "login"; code: string }>("/api/partner/lookup", jsonPost({ code: code.trim() }));
      setCode(result.code);
      setIdentifier(result.code);
      setMode(result.next === "register" ? "reference" : "login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kod kontrol edilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const verifyReference = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (!referenceCode.trim()) {
      setFieldError("Size verilen referans kodunu gir.");
      return;
    }
    setBusy(true);
    try {
      const result = await request<{ success: boolean }>("/api/partner/reference", jsonPost({ code, referenceCode: referenceCode.trim() }));
      if (!result.success) throw new Error("Referans kodu doğrulanamadı.");
      setMode("register");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Referans kodu doğrulanamadı.");
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (mode === "register" && !/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      setFieldError("Kullanıcı adı 3 ile 32 karakter olmalı. Harf, rakam, nokta, alt çizgi ve tire kullanabilirsin.");
      return;
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setFieldError("Şifre en az 8 karakter olmalı ve 72 baytı aşmamalı.");
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "register" ? "/api/partner/register" : "/api/partner/login";
      const payload = mode === "register"
        ? { code, referenceCode: referenceCode.trim(), username, password }
        : { identifier: identifier.trim(), password };
      const profile = await request<PartnerProfile>(endpoint, jsonPost(payload));
      onAuthenticated(profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : mode === "register" ? "Hesap oluşturulamadı." : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const returnToLogin = () => {
    setMode("login");
    setCode("");
    setReferenceCode("");
    setUsername("");
    setPassword("");
    setIdentifier("");
    clearMessages();
  };

  const returnToLookup = () => {
    setMode("lookup");
    setCode("");
    setReferenceCode("");
    setUsername("");
    setPassword("");
    setIdentifier("");
    clearMessages();
  };

  const title = mode === "login"
    ? "Partner Girişi"
    : mode === "lookup"
      ? "Kodunu bul"
      : mode === "reference"
        ? "Referans doğrulama"
        : "Hesabını oluştur";

  return (
    <main lang="tr" className="partner-root flex min-h-[100dvh] flex-col">
      <header className="flex h-[76px] items-center justify-between border-b partner-border px-5 sm:px-8">
        <a href="/" aria-label="HANK ana sayfa" className="inline-flex items-center">
          <span className="bg-black px-2 py-1"><img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-7 w-auto invert sm:h-8" /></span>
        </a>
        <a href="/" className="text-xs font-semibold partner-muted hover:text-white">Siteye dön</a>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="w-full max-w-[390px]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] partner-muted">PARTNER</p>
          <h1 className="partner-display text-4xl leading-none">{title}</h1>
          <p className="partner-muted mt-3 max-w-sm text-sm leading-6">
            {mode === "login" && "Kullanıcı adın veya partner kodunla hesabına gir."}
            {mode === "lookup" && "Hesabını bulmak için sana tanımlanan HANK kodunu yaz."}
            {mode === "reference" && "Kayıt adımına geçmek için sana verilen referans kodunu doğrula."}
            {mode === "register" && "Kullanıcı adını ve şifreni belirleyerek hesabını tamamla."}
          </p>
          {(error || fieldError) && <div className="mt-5"><ErrorBox>{fieldError || error}</ErrorBox></div>}

          {mode === "login" && (
            <form onSubmit={submitCredentials} className="mt-7 space-y-4">
              <div>
                <label htmlFor="partner-identifier" className="mb-1.5 block text-xs font-bold">Kullanıcı adı veya kod</label>
                <input id="partner-identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={fieldClass} aria-invalid={Boolean(fieldError)} required />
              </div>
              <div>
                <label htmlFor="partner-password" className="mb-1.5 block text-xs font-bold">Şifre</label>
                <div className="relative">
                  <input id="partner-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} pr-12`} required />
                  <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((value) => !value)} className="partner-muted absolute inset-y-0 right-0 grid w-11 place-items-center hover:text-white">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button disabled={busy} className="partner-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold disabled:opacity-60">
                {busy && <LoaderCircle size={16} className="animate-spin" />}Giriş yap
              </button>
              <button type="button" onClick={() => { setMode("lookup"); clearMessages(); }} className="w-full py-2 text-sm font-semibold underline underline-offset-4 hover:text-neutral-300">İlk kez giriş yapıyorum</button>
            </form>
          )}

          {mode === "lookup" && (
            <form onSubmit={checkCode} className="mt-7 space-y-4">
              <label htmlFor="partner-code" className="mb-1.5 block text-xs font-bold">HANK kodu</label>
              <input id="partner-code" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} className={fieldClass} required />
              <button disabled={busy} className="partner-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold disabled:opacity-60">
                {busy && <LoaderCircle size={16} className="animate-spin" />}Devam et<ArrowRight size={16} />
              </button>
              <button type="button" onClick={returnToLogin} className="w-full py-2 text-sm font-semibold underline underline-offset-4">Giriş ekranına dön</button>
            </form>
          )}

          {mode === "reference" && (
            <form onSubmit={verifyReference} className="mt-7 space-y-4">
              <label htmlFor="partner-reference" className="mb-1.5 block text-xs font-bold">Referans kodu</label>
              <input id="partner-reference" autoComplete="off" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} className={fieldClass} required />
              <button disabled={busy} className="partner-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold disabled:opacity-60">
                {busy && <LoaderCircle size={16} className="animate-spin" />}Doğrula ve devam et<ArrowRight size={16} />
              </button>
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={returnToLogin} className="w-full py-1 text-sm font-semibold underline underline-offset-4">Giriş ekranına dön</button>
                <button type="button" onClick={returnToLookup} className="partner-muted py-1 text-xs underline underline-offset-4">Farklı kodla devam et</button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={submitCredentials} className="mt-7 space-y-4">
              <div>
                <label htmlFor="partner-username" className="mb-1.5 block text-xs font-bold">Kullanıcı adı</label>
                <input id="partner-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className={fieldClass} required />
              </div>
              <div>
                <label htmlFor="partner-new-password" className="mb-1.5 block text-xs font-bold">Şifre</label>
                <div className="relative">
                  <input id="partner-new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} pr-12`} required />
                  <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((value) => !value)} className="partner-muted absolute inset-y-0 right-0 grid w-11 place-items-center hover:text-white">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button disabled={busy} className="partner-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold disabled:opacity-60">
                {busy && <LoaderCircle size={16} className="animate-spin" />}Hesabı oluştur
              </button>
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={returnToLogin} className="w-full py-1 text-sm font-semibold underline underline-offset-4">Giriş ekranına dön</button>
                <button type="button" onClick={returnToLookup} className="partner-muted py-1 text-xs underline underline-offset-4">Farklı kodla devam et</button>
              </div>
            </form>
          )}
        </section>
      </div>
      <footer className="partner-muted px-5 py-4 text-center text-[10px] tracking-[0.14em]">PARTNER ALANI</footer>
    </main>
  );
}
