ALTER TABLE "ReferralCampaign" ADD COLUMN "maxRewardCap" integer;
ALTER TABLE "ReferralMilestone" ADD COLUMN "qualifiedCountTrigger" integer NOT NULL DEFAULT 1;
ALTER TABLE "ReferralMilestone" ADD COLUMN "totalMilestoneValue" integer NOT NULL DEFAULT 0;
ALTER TABLE "ReferralMilestone" ADD COLUMN "incrementalAmount" integer NOT NULL DEFAULT 0;
ALTER TABLE "Reward" ADD COLUMN "campaignId" text;
ALTER TABLE "Reward" ADD COLUMN "achievementId" text;
ALTER TABLE "Reward" ADD COLUMN "qualifiedCountTrigger" integer;
ALTER TABLE "Reward" ADD COLUMN "totalMilestoneValue" integer;
ALTER TABLE "Reward" ADD COLUMN "incrementalAmount" integer;
ALTER TABLE "Reward" ADD COLUMN "reversedAt" timestamp(3);
CREATE TABLE "ReferralMilestoneAchievement" (
  "id" text PRIMARY KEY,
  "campaignId" text NOT NULL,
  "milestoneId" text NOT NULL,
  "userId" text NOT NULL,
  "qualifiedCount" integer NOT NULL,
  "totalMilestoneValue" integer NOT NULL,
  "incrementalAmount" integer NOT NULL,
  "achievedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" timestamp(3),
  "rewardId" text NOT NULL,
  CONSTRAINT "ReferralMilestoneAchievement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ReferralCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAchievement_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ReferralMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAchievement_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ReferralCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "ReferralMilestoneAchievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ReferralMilestoneAchievement_campaignId_userId_milestoneId_key" ON "ReferralMilestoneAchievement"("campaignId","userId","milestoneId");
CREATE UNIQUE INDEX "ReferralMilestoneAchievement_rewardId_key" ON "ReferralMilestoneAchievement"("rewardId");
CREATE INDEX "ReferralMilestoneAchievement_userId_campaignId_idx" ON "ReferralMilestoneAchievement"("userId","campaignId");
CREATE UNIQUE INDEX "Reward_userId_campaignId_milestoneId_key" ON "Reward"("userId","campaignId","milestoneId");
