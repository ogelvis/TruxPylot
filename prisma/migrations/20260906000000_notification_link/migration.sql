-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "link" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
