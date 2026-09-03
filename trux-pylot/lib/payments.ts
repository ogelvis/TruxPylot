import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export function makeReference(jobId: string) { return `TP-${jobId}-${crypto.randomUUID().slice(0,8)}`; }
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
