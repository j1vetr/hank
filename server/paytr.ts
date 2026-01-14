import crypto from 'crypto';

const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || '';
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || '';
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || '';

export interface PayTRTokenRequest {
  merchantOid: string;
  userIp: string;
  email: string;
  paymentAmount: number; // in kuruş (TL * 100)
  userName: string;
  userAddress: string;
  userPhone: string;
  userBasket: Array<[string, string, number]>; // [name, price in kuruş, quantity]
  okUrl: string;
  failUrl: string;
  noInstallment?: '0' | '1';
  maxInstallment?: string;
  currency?: 'TL' | 'USD' | 'EUR';
  testMode?: '0' | '1';
  debugOn?: '0' | '1';
  lang?: 'tr' | 'en';
  timeoutLimit?: string;
}

export interface PayTRTokenResponse {
  status: 'success' | 'failed';
  token?: string;
  reason?: string;
}

export async function getPayTRToken(request: PayTRTokenRequest): Promise<PayTRTokenResponse> {
  const {
    merchantOid,
    userIp,
    email,
    paymentAmount,
    userName,
    userAddress,
    userPhone,
    userBasket,
    okUrl,
    failUrl,
    noInstallment = '1',
    maxInstallment = '0',
    currency = 'TL',
    testMode = '0',
    debugOn = '1',
    lang = 'tr',
    timeoutLimit = '30'
  } = request;

  // Encode basket to base64
  const userBasketB64 = Buffer.from(JSON.stringify(userBasket)).toString('base64');

  // Calculate hash
  const hashStr = MERCHANT_ID + userIp + merchantOid + email + paymentAmount.toString() +
    userBasketB64 + noInstallment + maxInstallment + currency + testMode + MERCHANT_SALT;

  const paytrToken = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashStr)
    .digest('base64');

  // Prepare POST data
  const postData = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email: email,
    payment_amount: paymentAmount.toString(),
    paytr_token: paytrToken,
    user_basket: userBasketB64,
    debug_on: debugOn,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: userName,
    user_address: userAddress,
    user_phone: userPhone,
    merchant_ok_url: okUrl,
    merchant_fail_url: failUrl,
    timeout_limit: timeoutLimit,
    currency: currency,
    test_mode: testMode,
    lang: lang
  });

  try {
    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData.toString()
    });

    const result = await response.json();
    return result as PayTRTokenResponse;
  } catch (error) {
    console.error('PayTR token request failed:', error);
    return {
      status: 'failed',
      reason: 'Connection error'
    };
  }
}

export interface PayTRCallbackData {
  merchant_oid: string;
  status: 'success' | 'failed';
  total_amount: string;
  hash: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
  test_mode?: string;
  payment_type?: string;
  currency?: string;
  payment_amount?: string;
}

export function verifyPayTRCallback(data: PayTRCallbackData): boolean {
  const hashStr = data.merchant_oid + MERCHANT_SALT + data.status + data.total_amount;
  
  const expectedHash = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashStr)
    .digest('base64');

  return expectedHash === data.hash;
}
