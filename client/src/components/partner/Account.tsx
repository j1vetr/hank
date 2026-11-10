import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { PartnerProfile } from "./partner-api";
import { commissionText, jsonPost, request } from "./partner-api";
import { ErrorBox } from "./PartnerPrimitives";

export default function Account({ profile }: { profile: PartnerProfile }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const bytes = new TextEncoder().encode(newPassword).length;
    if (newPassword.length < 8 || bytes > 72) {
      setError("Yeni şifre en az 8 karakter olmalı ve 72 baytı aşmamalı.");
      return;
    }
    setBusy(true);
    try {
      await request("/api/partner/password", jsonPost({ currentPassword, password: newPassword }));
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Şifren güncellendi. Bu oturum açık kalacak.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Şifre değiştirilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-3xl space-y-7">
      <header className="partner-border border-b pb-5">
        <p className="partner-muted text-[10px] font-bold uppercase tracking-[0.2em]">HESAP AYARLARI</p>
        <h1 className="partner-display mt-1 text-4xl uppercase">Hesabım</h1>
        <p className="partner-muted mt-2 text-sm">Partner kimliğin ve şifre güvenliğin.</p>
      </header>

      <section className="partner-card">
        <div className="partner-border border-b px-5 py-4">
          <p className="partner-muted text-[10px] font-bold uppercase tracking-[0.18em]">PARTNER KİMLİĞİ</p>
          <h2 className="partner-display text-2xl uppercase">Hesap bilgileri</h2>
        </div>
        <dl className="grid gap-x-8 px-5 py-2 sm:grid-cols-2">
          <div className="partner-border border-b py-4"><dt className="partner-muted text-[10px] font-bold uppercase tracking-wider">Ad soyad</dt><dd className="mt-1 text-sm font-semibold">{profile.name}</dd></div>
          <div className="partner-border border-b py-4"><dt className="partner-muted text-[10px] font-bold uppercase tracking-wider">Kullanıcı adı</dt><dd className="mt-1 text-sm font-semibold">{profile.username}</dd></div>
          <div className="partner-border border-b py-4"><dt className="partner-muted text-[10px] font-bold uppercase tracking-wider">Partner kodu</dt><dd className="mt-1 font-mono text-sm font-bold">{profile.code}</dd></div>
          <div className="partner-border border-b py-4"><dt className="partner-muted text-[10px] font-bold uppercase tracking-wider">Komisyon oranı</dt><dd className="mt-1 text-sm font-semibold">{commissionText(profile)}</dd></div>
        </dl>
      </section>

      <section className="partner-card p-5 sm:p-6">
        <p className="partner-muted text-[10px] font-bold uppercase tracking-[0.18em]">GÜVENLİK</p>
        <h2 className="partner-display text-3xl uppercase">Şifreyi güncelle</h2>
        <p className="partner-muted mt-1 text-xs">Şifre güncellendiğinde bu cihazdaki oturum açık kalır.</p>
        <form onSubmit={updatePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="partner-current-password" className="mb-1.5 block text-xs font-bold">Mevcut şifre</label>
            <div className="relative">
              <input id="partner-current-password" type={showCurrent ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="partner-input w-full px-3.5 py-3 pr-12 text-sm" required />
              <button type="button" aria-label={showCurrent ? "Mevcut şifreyi gizle" : "Mevcut şifreyi göster"} onClick={() => setShowCurrent((value) => !value)} className="partner-muted absolute inset-y-0 right-0 grid w-11 place-items-center hover:text-white">{showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <div>
            <label htmlFor="partner-updated-password" className="mb-1.5 block text-xs font-bold">Yeni şifre</label>
            <div className="relative">
              <input id="partner-updated-password" type={showNew ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="partner-input w-full px-3.5 py-3 pr-12 text-sm" required />
              <button type="button" aria-label={showNew ? "Yeni şifreyi gizle" : "Yeni şifreyi göster"} onClick={() => setShowNew((value) => !value)} className="partner-muted absolute inset-y-0 right-0 grid w-11 place-items-center hover:text-white">{showNew ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          {error && <div className="sm:col-span-2"><ErrorBox>{error}</ErrorBox></div>}
          {success && <p role="status" className="partner-border border px-3 py-2 text-xs sm:col-span-2">{success}</p>}
          <button disabled={busy} className="partner-primary flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold disabled:opacity-60 sm:col-span-2 sm:w-fit">
            {busy && <LoaderCircle size={16} className="animate-spin" />}Şifreyi güncelle
          </button>
        </form>
      </section>
    </section>
  );
}
