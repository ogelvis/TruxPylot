import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { creditReferralReward } from '@/lib/wallet';

const actionSchema = z.object({ id: z.string().cuid(), action: z.enum(['approve', 'reject', 'pay']), reason: z.string().max(300).optional() });
async function admin() { return requireAdminSession(); }

export async function GET() {
  if (!await admin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const [referrals, rewards, withdrawals] = await Promise.all([
    prisma.referral.findMany({ include: { referrer: { select: { email: true } }, referred: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.reward.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.withdrawal.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  return NextResponse.json({ referrals, rewards, withdrawals });
}

export async function PATCH(request: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
  const { id, action, reason } = parsed.data;
  if (action === 'pay' || action === 'approve') {
    const current = await prisma.reward.findUnique({ where: { id }, include: { achievement: true } });
    if (!current || current.status === 'VOID' || (action === 'approve' && current.status !== 'PENDING') || (action === 'pay' && current.status !== 'APPROVED')) return NextResponse.json({ error: 'Reward is not in a valid state for this action.' }, { status: 409 });
    const reward = await prisma.$transaction(async tx => {
      const updated = await tx.reward.update({ where: { id }, data: { status: action === 'pay' ? 'PAID' : 'APPROVED', approvedById: session.userId, paidAt: action === 'pay' ? new Date() : undefined } });
      await creditReferralReward(tx, updated.id);
      return updated;
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: `REFERRAL_REWARD_${action.toUpperCase()}`, entity: 'Reward', entityId: id } });
    return NextResponse.json({ ok: true, reward });
  }
  const current = await prisma.reward.findUnique({ where: { id }, include: { achievement: true } });
  if (!current || current.status !== 'PENDING') return NextResponse.json({ error: 'Only pending rewards can be rejected.' }, { status: 409 });
  const reward = await prisma.reward.update({ where: { id }, data: { status: 'VOID', reason: reason || 'Rejected by admin', approvedById: session.userId, reversedAt: new Date() } });
  if (current.achievement) await prisma.referralMilestoneAchievement.update({ where: { id: current.achievement.id }, data: { reversedAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'REFERRAL_REWARD_REJECTED', entity: 'Reward', entityId: id, data: { reason } } });
  return NextResponse.json({ ok: true, reward });
}
