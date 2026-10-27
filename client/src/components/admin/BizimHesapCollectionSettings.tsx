import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

type CollectionSettings = {
  enabled: boolean;
  cashId: string | null;
  cashTitle: string | null;
  updatedAt: string | null;
};

type Cashier = {
  id: string;
  title: string;
};

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json() as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export default function BizimHesapCollectionSettings() {
  const [settings, setSettings] = useState<CollectionSettings | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [selectedCashId, setSelectedCashId] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cashiersLoading, setCashiersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [cashiersError, setCashiersError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const cashierIds = useMemo(() => new Set(cashiers.map((cashier) => cashier.id)), [cashiers]);
  const selectedCashier = cashiers.find((cashier) => cashier.id === selectedCashId);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const response = await fetch('/api/admin/bizimhesap/collection-settings', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Tahsilat ayarları alınamadı'));
      }
      const data = await response.json() as CollectionSettings;
      setSettings(data);
      setEnabled(data.enabled);
      setSelectedCashId(data.cashId || '');
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Tahsilat ayarları alınamadı');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadCashiers = useCallback(async () => {
    setCashiersLoading(true);
    setCashiersError('');
    try {
      const response = await fetch('/api/admin/bizimhesap/cashiers', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Kasa listesi alınamadı'));
      }
      const data = await response.json() as { cashiers: Cashier[] };
      setCashiers(Array.isArray(data.cashiers) ? data.cashiers : []);
    } catch (error) {
      setCashiersError(error instanceof Error ? error.message : 'Kasa listesi alınamadı');
      setCashiers([]);
    } finally {
      setCashiersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void loadCashiers();
  }, [loadSettings, loadCashiers]);

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess('');
    if (enabled && (!selectedCashId || !cashierIds.has(selectedCashId))) {
      setSaveError('Etkinleştirmek için listeden geçerli bir kredi kartı kasası seçin');
      return;
    }

    setSaving(true);
    try {
      const payload = enabled ? { enabled: true, cashId: selectedCashId } : { enabled: false };
      const response = await fetch('/api/admin/bizimhesap/collection-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Ayarlar kaydedilemedi'));
      }
      const updated = await response.json() as CollectionSettings;
      setSettings(updated);
      setEnabled(updated.enabled);
      setSelectedCashId(updated.cashId || '');
      setSaveSuccess('Tahsilat yapılandırması kaydedildi');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const statusText = settingsLoading
    ? 'Yapılandırma yükleniyor'
    : settingsError
      ? 'Yapılandırma durumu alınamadı'
      : settings?.enabled
        ? 'Etkin'
        : 'Devre dışı';

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900" aria-labelledby="bizimhesap-collection-title">
      <div className="border-b border-zinc-800 bg-gradient-to-r from-emerald-950/45 via-zinc-900 to-zinc-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/70 p-2.5 text-emerald-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/80">BizimHesap · PayTR</p>
              <h3 id="bizimhesap-collection-title" className="text-lg font-semibold text-zinc-100">Kredi kartı tahsilat kasası</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                Başarılı ödemeli yeni siparişlerde kullanılacak kasayı seçin. Ayar SMTP ve diğer sistem ayarlarından bağımsızdır.
              </p>
            </div>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              settingsLoading || settingsError
                ? 'border-zinc-700 bg-zinc-800/70 text-zinc-300'
                : settings?.enabled
                  ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-800/70 text-zinc-300'
            }`}
            data-testid="collection-settings-status"
            aria-live="polite"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${settings?.enabled && !settingsLoading && !settingsError ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            Durum: {statusText}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {settingsError && (
          <div className="flex flex-col gap-3 rounded-lg border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between" data-testid="collection-config-error" role="alert">
            <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{settingsError}</span>
            <button type="button" onClick={() => void loadSettings()} className="w-fit rounded-md border border-rose-800/80 px-3 py-1.5 font-medium hover:bg-rose-900/40">
              Yeniden dene
            </button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)]">
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700">
              <input
                type="checkbox"
                checked={enabled}
                disabled={settingsLoading || Boolean(settingsError)}
                onChange={(event) => {
                  setEnabled(event.target.checked);
                  setSaveError('');
                  setSaveSuccess('');
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500 disabled:cursor-not-allowed"
                data-testid="collection-enable-control"
                aria-label="PayTR tahsilat kasa eşlemesini etkinleştir"
              />
              <span>
                <span className="block text-sm font-semibold text-zinc-100">PayTR tahsilat kasa eşlemesini etkinleştir</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-400">
                  Etkinleştirme yalnızca kaydettiğinizde uygulanır. Devre dışıyken de kasaları görüntüleyebilirsiniz.
                </span>
              </span>
            </label>

            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <label htmlFor="bizimhesap-cashier" className="block text-sm font-medium text-zinc-200">Kredi kartı tahsilat kasası</label>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">Elle kredi kartı tahsilatında kullandığınız doğru hesabı seçin.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadCashiers()}
                  disabled={cashiersLoading}
                  data-testid="refresh-cashiers"
                  className="inline-flex w-fit items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${cashiersLoading ? 'animate-spin' : ''}`} />
                  Kasa listesini yenile
                </button>
              </div>

              <select
                id="bizimhesap-cashier"
                value={selectedCashId}
                onChange={(event) => {
                  setSelectedCashId(event.target.value);
                  setSaveError('');
                  setSaveSuccess('');
                }}
                disabled={cashiersLoading || cashiers.length === 0}
                data-testid="cashier-select"
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Kasa seçin</option>
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>{cashier.title}</option>
                ))}
              </select>

              <div className="mt-2 min-h-5 text-xs" aria-live="polite">
                {cashiersLoading ? (
                  <span className="inline-flex items-center gap-2 text-zinc-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Kasa listesi yükleniyor</span>
                ) : cashiersError ? (
                  <span className="text-rose-300" data-testid="cashier-list-error" role="alert">{cashiersError}</span>
                ) : cashiers.length === 0 ? (
                  <span className="text-zinc-500">Listede kullanılabilir kasa bulunamadı</span>
                ) : selectedCashier ? (
                  <span className="text-zinc-500">Seçili hesap: <span className="text-zinc-300">{selectedCashier.title}</span></span>
                ) : settings?.cashTitle && settings.cashId === selectedCashId ? (
                  <span className="text-zinc-500">Kayıtlı hesap: <span className="text-zinc-300">{settings.cashTitle}</span></span>
                ) : (
                  <span className="text-zinc-500">{cashiers.length} kasa listelendi</span>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-amber-200">
              <ShieldCheck className="h-4 w-4" />
              <h4 className="text-sm font-semibold">İlk siparişte doğrulayın</h4>
            </div>
            <p className="text-xs leading-5 text-amber-100/75">
              Bu ayar etkinleştirildikten sonra yalnızca yeni oluşturulan ve PayTR ödemesi başarıyla tamamlanan siparişlere uygulanır. Seçilen kasa sipariş üzerinde anlık görüntü olarak saklanır.
            </p>
            <p className="mt-2 text-xs leading-5 text-amber-100/75">
              Geçmiş faturalar ve elle girilen tahsilatlar değişmez. Ayrı bir AddCollection çağrısı gönderilmez. Fatura başarısı tek başına tahsilatın başarılı olduğunu göstermez. İlk yeni ödemeli siparişte sağlayıcının önceki tahsilatları sonucunu doğrulayın.
            </p>
            <p className="mt-2 border-t border-amber-900/40 pt-2 text-xs font-medium leading-5 text-amber-100">
              İlk gerçek yeni ödemeli siparişte kredi kartı tipini ve tutarı kontrol edin.
            </p>
          </aside>
        </div>

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-900/70 bg-rose-950/30 px-4 py-3 text-sm text-rose-200" data-testid="collection-settings-error" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-900/70 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {saveSuccess}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-500">
            {settings?.updatedAt ? `Son kayıt: ${new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(settings.updatedAt))}` : 'Henüz kayıtlı bir değişiklik yok'}
          </p>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || settingsLoading || Boolean(settingsError) || (enabled && (!selectedCashId || !cashierIds.has(selectedCashId)))}
            data-testid="save-collection-settings"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Kaydediliyor' : enabled ? 'Etkinleştirmeyi kaydet' : 'Devre dışı bırak ve kaydet'}
          </button>
        </div>
      </div>
    </section>
  );
}
