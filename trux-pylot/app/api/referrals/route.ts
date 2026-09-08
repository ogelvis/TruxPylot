import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureReferralCode } from '@/lib/referrals';

const withdrawal = z.object({ amount: z.number().int().positive(), bankName: z.string().max(120).optional(), accountName: z.string().max(120).optional(), accountNumber: z.string().max(40).optional() });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const code = await ensureReferralCode(session.userId);
  const referrals = await prisma.referral.findMany({ where: { referrerId: session.userId }, include: { referred: { select: { email: true } }, rewards: true }, orderBy: { createdAt: 'desc' } });
  const rewards = await prisma.reward.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  const withdrawals = await prisma.withdrawal.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  const earned = rewards.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0);
  const withdrawn = withdrawals.filter(w => w.status !== 'REJECTED').reduce((sum, w) => sum + w.amount, 0);
  return NextResponse.json({
    code: code.code,
    shareUrl: `/ref/${code.code}`,
    referrals: referrals.map(referral => ({
      ...referral,
      referred: { label: referral.referred.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') },
    })),
    rewards,
    withdrawals,
    available: Math.max(0, earned - withdrawn),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const parsed = withdrawal.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid withdrawal amount.' }, { status: 400 });
  const rewards = await prisma.reward.findMany({ where: { userId: session.userId, status: 'APPROVED' } });
  const requested = await prisma.withdrawal.aggregate({ where: { userId: session.userId, status: { not: 'REJECTED' } }, _sum: { amount: true } });
  const available = rewards.reduce((sum, r) => sum + r.amount, 0) - (requested._sum.amount ?? 0);
  if (parsed.data.amount > available) return NextResponse.json({ error: 'Withdrawal exceeds your available reward balance.' }, { status: 400 });
  const item = await prisma.withdrawal.create({ data: { userId: session.userId, ...parsed.data } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'REFERRAL_WITHDRAWAL_REQUESTED', entity: 'Withdrawal', entityId: item.id } });
  return NextResponse.json({ ok: true, withdrawal: item }, { status: 201 });
}
