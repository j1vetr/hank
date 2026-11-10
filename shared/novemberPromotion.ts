export const NOVEMBER_SESSION_KEY = 'hank-november-2026-promo-dismissed';
export const NOVEMBER_POSTER_480 = '/uploads/promo/november-2026-480.webp';
export const NOVEMBER_POSTER_768 = '/uploads/promo/november-2026-768.webp';
export const NOVEMBER_HEADLINE = 'KASIM AYI İNDİRİMLERİ BAŞLADI %30 İNDİRİM!';
export const NOVEMBER_OFFER = '(%20 SEPETTE + %10 SPORCU KODU)';

export function isNovemberCampaignWindow(date: Date = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(date);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    return year === 2026 && month === 11;
  } catch {
    return false;
  }
}

export function isNovemberShoppingRoute(path: string): boolean {
  return path === '/'
    || path === '/magaza'
    || path.startsWith('/kategori/')
    || path.startsWith('/urun/');
}

export function hasNovemberSessionDismissal(): boolean {
  try {
    return window.sessionStorage.getItem(NOVEMBER_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberNovemberSessionDismissal(): void {
  try {
    window.sessionStorage.setItem(NOVEMBER_SESSION_KEY, '1');
  } catch {
    // Storage can be unavailable in private browsing. Component state still prevents repeats.
  }
}

