ALTER TABLE "DedicatedAccount" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PROVISIONING';
ALTER TABLE "DedicatedAccount" ADD COLUMN "lastSyncError" TEXT;
ALTER TABLE "DedicatedAccount" ADD COLUMN "syncAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Withdrawal" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Withdrawal_idempotencyKey_key" ON "Withdrawal"("idempotencyKey");
CREATE TABLE "PayoutAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "bankCode" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PayoutAccount_userId_key" ON "PayoutAccount"("userId");
