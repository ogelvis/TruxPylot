import crypto from 'node:crypto';
export function makeReference(jobId: string) { return `TP-${jobId}-${crypto.randomUUID().slice(0,8)}`; }
export function verifyPaystackSignature(rawBody: string, signature: string | null) { const key = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY; if (!key || !signature) return false; const expected=crypto.createHmac('sha512',key).update(rawBody).digest('hex'); return signature.length===expected.length && crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }
