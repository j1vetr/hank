declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function fbq(...args: any[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export function trackPageView() {
  fbq('track', 'PageView');
}

export function trackViewContent(params: {
  contentId: string;
  contentName: string;
  contentCategory?: string;
  value: number;
  currency?: string;
}) {
  const eventId = generateEventId();
  fbq('track', 'ViewContent', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_category: params.contentCategory || '',
    content_type: 'product',
    value: params.value,
    currency: params.currency || 'TRY',
  }, { eventID: eventId });

  fetch('/api/track/view-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      eventId,
      contentId: params.contentId,
      contentName: params.contentName,
      contentCategory: params.contentCategory,
      value: params.value,
      sourceUrl: window.location.href,
    }),
  }).catch(() => {});
}

export function trackAddToCart(params: {
  contentId: string;
  contentName: string;
  contentCategory?: string;
  value: number;
  currency?: string;
  quantity?: number;
}) {
  const eventId = generateEventId();
  fbq('track', 'AddToCart', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_category: params.contentCategory || '',
    content_type: 'product',
    value: params.value,
    currency: params.currency || 'TRY',
    contents: [{ id: params.contentId, quantity: params.quantity || 1 }],
  }, { eventID: eventId });

  fetch('/api/track/add-to-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      eventId,
      contentId: params.contentId,
      contentName: params.contentName,
      contentCategory: params.contentCategory,
      value: params.value,
      quantity: params.quantity || 1,
      sourceUrl: window.location.href,
    }),
  }).catch(() => {});
}

export function trackInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  contents?: Array<{ id: string; quantity: number; price: number }>;
}) {
  const eventId = generateEventId();
  fbq('track', 'InitiateCheckout', {
    content_ids: params.contentIds,
    content_type: 'product',
    value: params.value,
    currency: params.currency || 'TRY',
    num_items: params.numItems,
    contents: params.contents,
  }, { eventID: eventId });

  fetch('/api/track/initiate-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      eventId,
      contentIds: params.contentIds,
      value: params.value,
      numItems: params.numItems,
      contents: params.contents,
      sourceUrl: window.location.href,
    }),
  }).catch(() => {});
}

export function trackAddPaymentInfo(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  contents?: Array<{ id: string; quantity: number; price: number }>;
}) {
  const eventId = generateEventId();
  fbq('track', 'AddPaymentInfo', {
    content_ids: params.contentIds,
    content_type: 'product',
    value: params.value,
    currency: params.currency || 'TRY',
    contents: params.contents,
  }, { eventID: eventId });
}

export function trackPurchase(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  orderId: string;
  contents?: Array<{ id: string; quantity: number; price: number }>;
}) {
  const eventId = `purchase-${params.orderId}`;
  fbq('track', 'Purchase', {
    content_ids: params.contentIds,
    content_type: 'product',
    value: params.value,
    currency: params.currency || 'TRY',
    num_items: params.numItems,
    contents: params.contents,
    order_id: params.orderId,
  }, { eventID: eventId });
}
