import crypto from 'crypto';

const API = 'https://api.razorpay.com/v1';

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay is not configured on the server (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function rz<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.description || `Razorpay error ${res.status}`);
  return json as T;
}

export type RzPayment = { id: string; status: string; order_id: string; amount: number; currency: string };

export const createRazorpayOrder = (amountPaise: number, receipt: string, notes: Record<string, string>) =>
  rz<{ id: string; amount: number; currency: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: receipt.slice(0, 40), notes }),
  });

export const fetchPayment = (id: string) => rz<RzPayment>(`/payments/${id}`);

export const capturePayment = (id: string, amountPaise: number) =>
  rz<RzPayment>(`/payments/${id}/capture`, { method: 'POST', body: JSON.stringify({ amount: amountPaise, currency: 'INR' }) });

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature || '');
}
