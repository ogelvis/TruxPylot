UPDATE "ReferralMilestone"
SET
  "qualifiedCountTrigger" = "threshold",
  "totalMilestoneValue" = CASE "threshold"
    WHEN 1 THEN 500
    WHEN 3 THEN 1500
    WHEN 5 THEN 3000
    WHEN 10 THEN 10000
    WHEN 25 THEN 30000
    WHEN 50 THEN 75000
    ELSE "rewardAmount"
  END,
  "incrementalAmount" = CASE "threshold"
    WHEN 1 THEN 500
    WHEN 3 THEN 1000
    WHEN 5 THEN 1500
    WHEN 10 THEN 7000
    WHEN 25 THEN 20000
    WHEN 50 THEN 45000
    ELSE "rewardAmount"
  END;

INSERT INTO "ReferralMilestone" ("id", "campaignId", "name", "threshold", "rewardAmount", "qualifiedCountTrigger", "totalMilestoneValue", "incrementalAmount")
SELECT
  md5(c.id || '-milestone-10'),
  c.id,
  'Ten referrals',
  10,
  10000,
  10,
  10000,
  7000
FROM "ReferralCampaign" c
WHERE NOT EXISTS (
  SELECT 1 FROM "ReferralMilestone" m WHERE m."campaignId" = c.id AND m."threshold" = 10
);

INSERT INTO "ReferralMilestone" ("id", "campaignId", "name", "threshold", "rewardAmount", "qualifiedCountTrigger", "totalMilestoneValue", "incrementalAmount")
SELECT
  md5(c.id || '-milestone-25'),
  c.id,
  'Twenty-five referrals',
  25,
  30000,
  25,
  30000,
  20000
FROM "ReferralCampaign" c
WHERE NOT EXISTS (
  SELECT 1 FROM "ReferralMilestone" m WHERE m."campaignId" = c.id AND m."threshold" = 25
);

INSERT INTO "ReferralMilestone" ("id", "campaignId", "name", "threshold", "rewardAmount", "qualifiedCountTrigger", "totalMilestoneValue", "incrementalAmount")
SELECT
  md5(c.id || '-milestone-50'),
  c.id,
  'Fifty referrals',
  50,
  75000,
  50,
  75000,
  45000
FROM "ReferralCampaign" c
WHERE NOT EXISTS (
  SELECT 1 FROM "ReferralMilestone" m WHERE m."campaignId" = c.id AND m."threshold" = 50
);
