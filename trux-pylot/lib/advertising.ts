import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const INSTANT_ADVERT_PLANS = [
  { months: 1, days: 30, naira: 2000 },
  { months: 2, days: 60, naira: 3500 },
  { months: 3, days: 90, naira: 5000 },
] as const;

export function instantAdvertPlan(months: number) {
  return INSTANT_ADVERT_PLANS.find(plan => plan.months === months) ?? null;
}

export function makeInstantAdvertReference(professionalId: string) {
  return `TP-AD-${professionalId}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function applySuccessfulInstantAdvertPayment(reference: string, amountKobo: number, providerEventId?: string) {
  const purchase = await prisma.instantAdvertPurchase.findUnique({ where: { reference } });
  if (!purchase) return { ok: false as const, reason: 'not_found' as const };
  if (purchase.status === 'SUCCESS') return { ok: true as const, already: true };
  if (purchase.amount !== amountKobo) return { ok: false as const, reason: 'amount_mismatch' as const };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + purchase.durationDays * 86400000);
  const updated = await prisma.instantAdvertPurchase.updateMany({
    where: { id: purchase.id, status: 'PENDING' },
    data: { status: 'SUCCESS', providerEventId, startsAt: now, activatedAt: now, expiresAt },
  });
  return { ok: true as const, already: updated.count === 0 };
}
