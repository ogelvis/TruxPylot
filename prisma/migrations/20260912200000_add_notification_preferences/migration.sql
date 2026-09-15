CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobs" BOOLEAN NOT NULL DEFAULT true,
  "messages" BOOLEAN NOT NULL DEFAULT true,
  "payments" BOOLEAN NOT NULL DEFAULT true,
  "announcements" BOOLEAN NOT NULL DEFAULT true,
  "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
  "communicationAllowed" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
