import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureReferralCode } from '@/lib/referrals';
import { notifyUser } from '@/lib/notify';
import { sendFinancialTransactionEmail } from '@/lib/email';

const withdrawal = z.object({ amount: z.number().int().positive(), bankName: z.string().max(120).optional(), accountName: z.string().max(120).optional(), accountNumber: z.string().max(40).optional() });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const code = await ensureReferralCode(session.userId);
  const referrals = await prisma.referral.findMany({ where: { referrerId: session.userId }, include: { referred: { select: { email: true } }, rewards: true }, orderBy: { createdAt: 'desc' } });
  const rewards = await prisma.reward.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  const withdrawals = await prisma.withdrawal.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  const pending = rewards.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
  const approved = rewards.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0);
  const paid = rewards.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);
  const totalEarned = rewards.filter(r => r.status !== 'VOID').reduce((sum, r) => sum + r.amount, 0);
  const withdrawn = withdrawals.filter(w => w.status !== 'REJECTED').reduce((sum, w) => sum + w.amount, 0);
  const qualifiedCount = referrals.filter(r => r.status === 'QUALIFIED' || r.status === 'REWARDED').length;
  const milestones = code.campaign ? await prisma.referralMilestone.findMany({ where: { campaignId: code.campaign.id }, orderBy: { threshold: 'asc' } }) : [];
  const nextMilestone = milestones.find(m => m.qualifiedCountTrigger > qualifiedCount);
  return NextResponse.json({
    code: code.code,
    shareUrl: `/ref/${code.code}`,
    referrals: referrals.map(referral => ({
      ...referral,
      referred: { label: referral.referred.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') },
    })),
    rewards,
    withdrawals,
    qualifiedCount,
    nextMilestone: nextMilestone ? { threshold: nextMilestone.qualifiedCountTrigger, incrementalAmount: nextMilestone.incrementalAmount, totalMilestoneValue: nextMilestone.totalMilestoneValue } : null,
    pending,
    approved,
    paid,
    totalEarned,
    available: Math.max(0, approved + paid - withdrawn),
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
  const item = await prisma.withdrawal.create({ data: { userId: session.userId, source: 'REFERRAL', ...parsed.data } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'REFERRAL_WITHDRAWAL_REQUESTED', entity: 'Withdrawal', entityId: item.id } });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { professional: true, customer: true } });
  if (user) {
    const name = user.professional?.fullName ?? user.customer?.fullName ?? 'TruxPylot user';
    await notifyUser({ userId: session.userId, type: 'referral_withdrawal', title: 'Referral withdrawal requested', body: `Your ₦${(item.amount / 100).toLocaleString('en-NG')} referral withdrawal request has been recorded.`, link: user.professional ? '/dashboard/professional/referrals' : '/dashboard/customer/referrals' }).catch(() => {});
    await sendFinancialTransactionEmail({ to: user.email, fullName: name, title: 'Referral withdrawal requested', body: 'Your referral reward withdrawal request has been recorded and is subject to processing and verification.', amountKobo: item.amount, reference: item.providerReference, status: 'Requested' }).catch(() => {});
  }
  return NextResponse.json({ ok: true, withdrawal: item }, { status: 201 });
}
