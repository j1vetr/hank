import bizSdk from 'facebook-nodejs-business-sdk';

const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const PIXEL_ID = process.env.META_PIXEL_ID || '';

let apiInitialized = false;

function initApi() {
  if (!apiInitialized && ACCESS_TOKEN) {
    bizSdk.FacebookAdsApi.init(ACCESS_TOKEN);
    apiInitialized = true;
  }
}

interface UserDataParams {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

interface ContentItem {
  id: string;
  quantity: number;
  price?: number;
  title?: string;
  category?: string;
}

interface EventParams {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: UserDataParams;
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentType?: string;
    contents?: ContentItem[];
    contentName?: string;
    contentCategory?: string;
    numItems?: number;
  };
}

function normalizeCountryCode(country?: string): string | undefined {
  if (!country) return undefined;
  const countryMap: Record<string, string> = {
    'Türkiye': 'tr', 'Turkey': 'tr', 'Irak': 'iq', 'Iraq': 'iq',
    'Almanya': 'de', 'Germany': 'de', 'Fransa': 'fr', 'France': 'fr',
    'İngiltere': 'gb', 'United Kingdom': 'gb', 'ABD': 'us', 'United States': 'us',
    'Hollanda': 'nl', 'Netherlands': 'nl', 'Belçika': 'be', 'Belgium': 'be',
    'Avusturya': 'at', 'Austria': 'at', 'İsviçre': 'ch', 'Switzerland': 'ch',
    'İsveç': 'se', 'Sweden': 'se', 'Norveç': 'no', 'Norway': 'no',
    'Danimarka': 'dk', 'Denmark': 'dk', 'İtalya': 'it', 'Italy': 'it',
    'İspanya': 'es', 'Spain': 'es', 'Portekiz': 'pt', 'Portugal': 'pt',
    'Yunanistan': 'gr', 'Greece': 'gr', 'Bulgaristan': 'bg', 'Bulgaria': 'bg',
    'Romanya': 'ro', 'Romania': 'ro', 'Polonya': 'pl', 'Poland': 'pl',
    'Çekya': 'cz', 'Czech Republic': 'cz', 'Macaristan': 'hu', 'Hungary': 'hu',
    'Rusya': 'ru', 'Russia': 'ru', 'Ukrayna': 'ua', 'Ukraine': 'ua',
    'Gürcistan': 'ge', 'Georgia': 'ge', 'Azerbaycan': 'az', 'Azerbaijan': 'az',
    'Suudi Arabistan': 'sa', 'Saudi Arabia': 'sa', 'BAE': 'ae',
    'Katar': 'qa', 'Qatar': 'qa', 'Kuveyt': 'kw', 'Kuwait': 'kw',
    'Japonya': 'jp', 'Japan': 'jp', 'Çin': 'cn', 'China': 'cn',
    'Güney Kore': 'kr', 'South Korea': 'kr', 'Hindistan': 'in', 'India': 'in',
    'Avustralya': 'au', 'Australia': 'au', 'Kanada': 'ca', 'Canada': 'ca',
    'Brezilya': 'br', 'Brazil': 'br', 'Meksika': 'mx', 'Mexico': 'mx',
  };
  if (countryMap[country]) return countryMap[country];
  if (country.length === 2) return country.toLowerCase();
  return country.substring(0, 2).toLowerCase();
}

export async function sendCapiEvent(params: EventParams): Promise<boolean> {
  if (!ACCESS_TOKEN || !PIXEL_ID) {
    console.log('[Meta CAPI] Missing credentials, skipping event:', params.eventName);
    return false;
  }

  try {
    initApi();

    const { ServerEvent, UserData, CustomData, Content, EventRequest } = bizSdk;

    const userData = new UserData();
    if (params.userData.email) userData.setEmail(params.userData.email.toLowerCase().trim());
    if (params.userData.phone) userData.setPhone(params.userData.phone.replace(/\D/g, ''));
    if (params.userData.firstName) userData.setFirstName(params.userData.firstName.toLowerCase().trim());
    if (params.userData.lastName) userData.setLastName(params.userData.lastName.toLowerCase().trim());
    if (params.userData.city) userData.setCity(params.userData.city.toLowerCase().trim());
    if (params.userData.state) userData.setState(params.userData.state.toLowerCase().trim());
    if (params.userData.zip) userData.setZip(params.userData.zip.trim());
    const countryCode = normalizeCountryCode(params.userData.country);
    if (countryCode) userData.setCountry(countryCode);
    if (params.userData.externalId) userData.setExternalId(params.userData.externalId);
    if (params.userData.clientIpAddress) userData.setClientIpAddress(params.userData.clientIpAddress);
    if (params.userData.clientUserAgent) userData.setClientUserAgent(params.userData.clientUserAgent);
    if (params.userData.fbp) userData.setFbp(params.userData.fbp);
    if (params.userData.fbc) userData.setFbc(params.userData.fbc);

    const serverEvent = new ServerEvent()
      .setEventName(params.eventName)
      .setEventTime(Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setActionSource('website')
      .setEventId(params.eventId);

    if (params.eventSourceUrl) {
      serverEvent.setEventSourceUrl(params.eventSourceUrl);
    }

    if (params.customData) {
      const customData = new CustomData();
      if (params.customData.value !== undefined) customData.setValue(params.customData.value);
      if (params.customData.currency) customData.setCurrency(params.customData.currency);
      if (params.customData.contentIds) customData.setContentIds(params.customData.contentIds);
      if (params.customData.contentType) customData.setContentType(params.customData.contentType);
      if (params.customData.contentName) customData.setContentName(params.customData.contentName);
      if (params.customData.contentCategory) customData.setContentCategory(params.customData.contentCategory);
      if (params.customData.numItems !== undefined) customData.setNumItems(params.customData.numItems);

      if (params.customData.contents && params.customData.contents.length > 0) {
        const contents = params.customData.contents.map(item => {
          const content = new Content();
          content.setId(item.id);
          content.setQuantity(item.quantity);
          if (item.price !== undefined) content.setItemPrice(item.price);
          if (item.title) content.setTitle(item.title);
          return content;
        });
        customData.setContents(contents);
      }

      serverEvent.setCustomData(customData);
    }

    const eventRequest = new EventRequest(ACCESS_TOKEN, PIXEL_ID)
      .setEvents([serverEvent]);

    const response = await eventRequest.execute();
    console.log(`[Meta CAPI] ${params.eventName} sent (event_id: ${params.eventId}):`, JSON.stringify(response));
    return true;
  } catch (error: any) {
    console.error(`[Meta CAPI] Failed to send ${params.eventName}:`, error.message || error);
    return false;
  }
}

export function extractFbCookies(cookieHeader?: string): { fbp?: string; fbc?: string } {
  if (!cookieHeader) return {};
  const fbp = cookieHeader.match(/_fbp=([^;]+)/)?.[1];
  const fbc = cookieHeader.match(/_fbc=([^;]+)/)?.[1];
  return { fbp, fbc };
}

export function getClientIp(req: any): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress || '';
}
