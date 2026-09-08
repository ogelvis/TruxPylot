import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

const DEFAULT_MILESTONES = [
  { name: 'First referral', threshold: 1, totalMilestoneValue: 500, incrementalAmount: 500 },
  { name: 'Three referrals', threshold: 3, totalMilestoneValue: 1500, incrementalAmount: 1000 },
  { name: 'Five referrals', threshold: 5, totalMilestoneValue: 3000, incrementalAmount: 1500 },
  { name: 'Ten referrals', threshold: 10, totalMilestoneValue: 10000, incrementalAmount: 7000 },
  { name: 'Twenty-five referrals', threshold: 25, totalMilestoneValue: 30000, incrementalAmount: 20000 },
  { name: 'Fifty referrals', threshold: 50, totalMilestoneValue: 75000, incrementalAmount: 45000 },
];

async function activeCampaign() {
  const now = new Date();
  const campaign = await prisma.referralCampaign.findFirst({
    where: { active: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
    include: { milestones: { orderBy: { threshold: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  if (campaign) return campaign;
  return prisma.referralCampaign.create({
      data: {
        name: 'Default referral campaign',
        qualificationJobs: 1,
        milestones: {
          create: DEFAULT_MILESTONES.map(m => ({ ...m, rewardAmount: m.totalMilestoneValue, qualifiedCountTrigger: m.threshold })),
        },
      },
      include: { milestones: { orderBy: { threshold: 'asc' } } },
    });
}

export async function ensureReferralCode(userId: string) {
  const existing = await prisma.referralCode.findFirst({ where: { ownerId: userId, active: true }, include: { campaign: true } });
  if (existing?.campaign) return existing;
  const campaign = await activeCampaign();
  if (existing) return prisma.referralCode.update({ where: { id: existing.id }, data: { campaignId: campaign.id }, include: { campaign: true } });
  return prisma.referralCode.create({ data: { ownerId: userId, campaignId: campaign.id, code: `TP-${randomBytes(4).toString('hex').toUpperCase()}` }, include: { campaign: true } });
}

export async function attributeReferral(codeValue: string, referredUserId: string, metadata?: Record<string, unknown>) {
  const code = await prisma.referralCode.findUnique({ where: { code: codeValue.toUpperCase() } });
  if (!code || !code.active || code.ownerId === referredUserId) return null;
  const existing = await prisma.referral.findUnique({ where: { referredId: referredUserId } });
  if (existing) return existing;
  return prisma.$transaction(async tx => {
    await tx.referralCode.update({ where: { id: code.id }, data: { clicks: { increment: 1 } } });
    await tx.referralAttribution.create({ data: { codeId: code.id, referredUserId, source: 'registration', metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined } });
    return tx.referral.create({ data: { codeId: code.id, referrerId: code.ownerId, referredId: referredUserId, campaignId: code.campaignId } });
  });
}

/** Qualifies once per referred user and creates each newly crossed milestone exactly once. */
export async function qualifyReferral(referredUserId: string) {
  const referral = await prisma.referral.findUnique({ where: { referredId: referredUserId }, include: { campaign: { include: { milestones: { orderBy: { threshold: 'asc' } } } } } });
  if (!referral || referral.status !== 'PENDING') return null;
  const campaign = referral.campaign;
  const now = new Date();
  const withinCampaign = campaign !== null && campaign.active && (!campaign.startsAt || campaign.startsAt <= now) && (!campaign.endsAt || campaign.endsAt > now);
  return prisma.$transaction(async tx => {
    const updated = await tx.referral.updateMany({ where: { id: referral.id, status: 'PENDING' }, data: { status: 'QUALIFIED', qualifiedAt: now } });
    if (!updated.count) return null;
    if (withinCampaign && campaign) {
      const qualifiedCount = await tx.referral.count({ where: { referrerId: referral.referrerId, campaignId: campaign.id, status: { in: ['QUALIFIED', 'REWARDED'] } } });
      const existingAchievements = await tx.referralMilestoneAchievement.findMany({ where: { campaignId: campaign.id, userId: referral.referrerId }, select: { milestoneId: true, incrementalAmount: true } });
      const claimed = new Set(existingAchievements.map(a => a.milestoneId));
      const earned = existingAchievements.reduce((sum, a) => sum + a.incrementalAmount, 0);
      let total = earned;
      for (const milestone of campaign.milestones.filter(m => m.qualifiedCountTrigger <= qualifiedCount && !claimed.has(m.id))) {
        const amount = milestone.incrementalAmount;
        if (campaign.maxRewardCap !== null && total + amount > campaign.maxRewardCap) continue;
        const reward = await tx.reward.create({ data: { referralId: referral.id, userId: referral.referrerId, milestoneId: milestone.id, campaignId: campaign.id, amount, incrementalAmount: amount, qualifiedCountTrigger: milestone.qualifiedCountTrigger, totalMilestoneValue: milestone.totalMilestoneValue, reason: `Referral milestone: ${milestone.name}` } });
        await tx.referralMilestoneAchievement.create({ data: { campaignId: campaign.id, milestoneId: milestone.id, userId: referral.referrerId, qualifiedCount: qualifiedCount, totalMilestoneValue: milestone.totalMilestoneValue, incrementalAmount: amount, rewardId: reward.id } });
        total += amount;
      }
      if (campaign.milestones.some(m => m.qualifiedCountTrigger <= qualifiedCount)) await tx.referral.update({ where: { id: referral.id }, data: { status: 'REWARDED', rewardedAt: now } });
      await tx.notification.create({ data: { userId: referral.referrerId, type: 'referral', title: 'Referral milestone earned', body: 'A referral milestone reward is pending admin review.', link: '/dashboard/customer/referrals' } });
    }
    await tx.notification.create({ data: { userId: referral.referredId, type: 'referral', title: 'Welcome to Trux Pylot', body: 'Your first completed job qualified your referral attribution.', link: '/dashboard' } });
    return tx.referral.findUnique({ where: { id: referral.id } });
  });
}
