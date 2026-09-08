import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function ensureReferralCode(userId: string) {
  const existing = await prisma.referralCode.findFirst({ where: { ownerId: userId, active: true } });
  if (existing) return existing;
  return prisma.referralCode.create({ data: { ownerId: userId, code: `TP-${randomBytes(4).toString('hex').toUpperCase()}` } });
}

export async function attributeReferral(codeValue: string, referredUserId: string, metadata?: Record<string, unknown>) {
  const code = await prisma.referralCode.findUnique({ where: { code: codeValue.toUpperCase() } });
  if (!code || !code.active || code.ownerId === referredUserId) return null;
  const existing = await prisma.referral.findUnique({ where: { referredId: referredUserId } });
  if (existing) return existing;
  return prisma.$transaction(async tx => {
    await tx.referralCode.update({ where: { id: code.id }, data: { clicks: { increment: 1 } } });
    await tx.referralAttribution.create({
      data: { codeId: code.id, referredUserId, source: 'registration', metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
    });
    return tx.referral.create({
      data: { codeId: code.id, referrerId: code.ownerId, referredId: referredUserId, campaignId: code.campaignId },
    });
  });
}

/** Marks a referral qualified once the referred user has a legitimate settled job. */
export async function qualifyReferral(referredUserId: string) {
  const referral = await prisma.referral.findUnique({
    where: { referredId: referredUserId },
    include: { campaign: true },
  });
  if (!referral || referral.status !== 'PENDING') return null;
  const amount = referral.campaign?.rewardAmount ?? 0;
  return prisma.$transaction(async tx => {
    const updated = await tx.referral.update({
      where: { id: referral.id },
      data: { status: amount > 0 ? 'REWARDED' : 'QUALIFIED', qualifiedAt: new Date(), rewardedAt: amount > 0 ? new Date() : undefined },
    });
    if (amount > 0) {
      await tx.reward.create({
        data: { referralId: referral.id, userId: referral.referrerId, amount, status: 'PENDING', reason: 'Referral qualification reward' },
      });
      await tx.notification.create({
        data: { userId: referral.referrerId, type: 'referral', title: 'Referral reward earned', body: 'Your referral completed a legitimate job. Your cash reward is now under review.', link: '/dashboard/customer/referrals' },
      });
    }
    await tx.notification.create({
      data: { userId: referral.referredId, type: 'referral', title: 'Welcome to Trux Pylot', body: 'Your first completed job qualified your referral attribution.', link: '/dashboard' },
    });
    return updated;
  });
}
