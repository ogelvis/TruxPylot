CREATE TABLE "SecurityProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "passwordHash" TEXT,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecretEncrypted" TEXT,
  "recoveryCodesHash" TEXT,
  "securityReminderSeenAt" TIMESTAMP(3),
  "lastTwoFactorVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SecurityProfile_userId_key" ON "SecurityProfile"("userId");
ALTER TABLE "SecurityProfile" ADD CONSTRAINT "SecurityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityQuestion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answerHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityQuestion_userId_idx" ON "SecurityQuestion"("userId");
ALTER TABLE "SecurityQuestion" ADD CONSTRAINT "SecurityQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LoginAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "action" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "riskLevel" TEXT NOT NULL DEFAULT 'NORMAL',
  "failureReason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceFingerprint" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
CREATE INDEX "LoginAttempt_success_createdAt_idx" ON "LoginAttempt"("success", "createdAt");
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RecognizedDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecognizedDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RecognizedDevice_tokenHash_key" ON "RecognizedDevice"("tokenHash");
CREATE INDEX "RecognizedDevice_userId_revokedAt_idx" ON "RecognizedDevice"("userId", "revokedAt");
ALTER TABLE "RecognizedDevice" ADD CONSTRAINT "RecognizedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AccountSuspension" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "restoredAt" TIMESTAMP(3),
  "restoredById" TEXT,
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountSuspension_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AccountSuspension_userId_status_idx" ON "AccountSuspension"("userId", "status");
CREATE INDEX "AccountSuspension_status_requestedAt_idx" ON "AccountSuspension"("status", "requestedAt");
ALTER TABLE "AccountSuspension" ADD CONSTRAINT "AccountSuspension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SystemAnnouncement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "audience" TEXT NOT NULL DEFAULT 'ALL',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publishAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SystemAnnouncement_status_publishAt_expiresAt_idx" ON "SystemAnnouncement"("status", "publishAt", "expiresAt");

CREATE TABLE "AnnouncementRead" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");
CREATE INDEX "AnnouncementRead_userId_readAt_idx" ON "AnnouncementRead"("userId", "readAt");
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "SystemAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
