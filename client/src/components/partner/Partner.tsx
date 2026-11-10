import { useCallback, useEffect, useState } from "react";
import type { PartnerProfile } from "./partner-api";
import { request } from "./partner-api";
import { ErrorBox } from "./PartnerPrimitives";
import AuthScreen from "./AuthScreen";
import PartnerShell from "./PartnerShell";
import "./partner.css";

export default function Partner() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const checkSession = useCallback(async () => {
    setChecking(true);
    setSessionError("");
    try {
      setProfile(await request<PartnerProfile>("/api/partner/me"));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Oturum kontrol edilemedi.";
      if (message.toLowerCase().includes("unauth") || message.toLowerCase().includes("giriş") || message.toLowerCase().includes("yetki")) {
        setProfile(null);
      } else {
        setProfile(null);
        setSessionError(message);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);

  const logout = async () => {
    await request("/api/partner/logout", { method: "POST" });
    setProfile(null);
  };

  if (checking) {
    return (
      <main lang="tr" className="partner-root grid min-h-[100dvh] place-items-center p-5">
        <div aria-label="Oturum kontrol ediliyor" className="w-full max-w-md space-y-4">
          <div className="partner-skeleton h-8 w-36" />
          <div className="partner-skeleton h-52" />
          <div className="partner-skeleton h-12" />
        </div>
      </main>
    );
  }
  if (sessionError) {
    return <main lang="tr" className="partner-root grid min-h-[100dvh] place-items-center p-5"><div className="w-full max-w-md"><ErrorBox onRetry={() => void checkSession()}>{sessionError}</ErrorBox></div></main>;
  }
  if (profile) return <PartnerShell profile={profile} onLogout={logout} />;
  return <AuthScreen onAuthenticated={setProfile} />;
}
