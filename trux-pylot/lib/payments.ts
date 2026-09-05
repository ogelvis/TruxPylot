import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export function makeReference(jobId: string) { return `TP-${jobId}-${crypto.randomUUID().slice(0,8)}`; }

// Premium purchase references get a distinct prefix so the shared Paystack
// webhook (one endpoint, configured once in the Paystack dashboard) can
// route an incoming charge.success event to the right table without
// needing separate webhook URLs or extra Paystack config.
const PREMIUM_REFERENCE_PREFIX = 'TP-PREM-';
export function makePremiumReference(professionalId: string) { return `${PREMIUM_REFERENCE_PREFIX}${professionalId}-${crypto.randomUUID().slice(0,8)}`; }
export function isPremiumReference(reference: string) { return reference.startsWith(PREMIUM_REFERENCE_PREFIX); }
export function verifyPaystackSignature(rawBody: string, signature: string | null) { const key = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY; if (!key || !signature) return false; const expected=crypto.createHmac('sha512',key).update(rawBody).digest('hex'); return signature.length===expected.length && crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }

/** Marks a payment SUCCESS, moves the job to PAID, and credits the
 *  professional's pending wallet balance — shared by the webhook (primary
 *  path) and the payment-callback page's fallback verify (in case the
 *  webhook is delayed or misconfigured). Idempotent: the `status:'PENDING'`
 *  guard on the update means calling this twice for the same reference is
 *  a no-op the second time, so both paths can safely race.
 *  Never call this from anywhere that only trusts client/browser input —
 *  callers must have independently confirmed success with Paystack first
 *  (webhook signature, or a server-side verify-transaction call). */
export async function applySuccessfulPayment(reference: string, amountKobo: number, providerEventId?: string) {
  const payment = await prisma.payment.findUnique({ where: { reference }, include: { job: { include: { professional: true } } } });
  if (!payment) return { ok: false as const, reason: 'not_found' as const };
  if (payment.status === 'SUCCESS') return { ok: true as const, already: true };
  if (payment.amount !== amountKobo) return { ok: false as const, reason: 'amount_mismatch' as const };

  await prisma.$transaction(async tx => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'SUCCESS', providerEventId },
    });
    if (!updated.count) return;
    await tx.job.update({ where: { id: payment.jobId }, data: { status: 'PAID' } });
    if (payment.job.professional) {
      await tx.wallet.upsert({
        where: { professionalId: payment.job.professional.id },
        create: { professionalId: payment.job.professional.id, pendingBalance: payment.amount - payment.commission },
        update: { pendingBalance: { increment: payment.amount - payment.commission } },
      });
    }
  });
  return { ok: true as const, already: false };
}

/** Premium-tier counterpart of applySuccessfulPayment above — same shape,
 *  same idempotency guarantee (safe to call twice for one reference; the
 *  `status:'PENDING'` guard on the update makes a repeat call a no-op),
 *  same rule: only call this after independently confirming success with
 *  Paystack (webhook signature, or a server-side verify-transaction call).
 *  Never derives Premium status from anything the browser claims. */
export async function applySuccessfulPremiumPayment(reference: string, amountKobo: number, providerEventId?: string) {
  const purchase = await prisma.premiumPurchase.findUnique({ where: { reference } });
  if (!purchase) return { ok: false as const, reason: 'not_found' as const };
  if (purchase.status === 'SUCCESS') return { ok: true as const, already: true };
  if (purchase.amount !== amountKobo) return { ok: false as const, reason: 'amount_mismatch' as const };

  const updated = await prisma.premiumPurchase.updateMany({
    where: { id: purchase.id, status: 'PENDING' },
    data: { status: 'SUCCESS', providerEventId, activatedAt: new Date() },
  });
  // If this loses the race against a concurrent success for the SAME
  // professional (a second attempt that somehow also verified), the
  // partial unique index on the table stops a second SUCCESS row from
  // ever existing — updateMany above would simply match 0 rows here.
  return { ok: true as const, already: !updated.count };
}

/** Premium price in kobo, from a single env-var source of truth — same
 *  pattern as PLATFORM_COMMISSION_PERCENT in lib/jobs.ts. Defaults to
 *  ₦25,000 if unset; change PREMIUM_PRICE_KOBO in the environment (no
 *  code change needed) to update the price everywhere it's shown. */
export function premiumPriceKobo() { return Number(process.env.PREMIUM_PRICE_KOBO ?? 2_500_000); }
