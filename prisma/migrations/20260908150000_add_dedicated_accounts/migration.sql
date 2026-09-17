CREATE TYPE "WalletTransactionSource_new" AS ENUM ('FUNDING','JOB_EARNING','REFERRAL_REWARD','PROMOTED_TOP10','WITHDRAWAL','ADJUSTMENT','DVA_TRANSFER');
ALTER TABLE "WalletTransaction" ALTER COLUMN "source" TYPE "WalletTransactionSource_new" USING ("source"::text::"WalletTransactionSource_new");
DROP TYPE "WalletTransactionSource";
ALTER TYPE "WalletTransactionSource_new" RENAME TO "WalletTransactionSource";
CREATE TABLE "DedicatedAccount" (
  "id" TEXT NOT NULL, "professionalId" TEXT NOT NULL, "walletId" TEXT NOT NULL,
  "paystackCustomerCode" TEXT NOT NULL, "paystackAccountId" TEXT,
  "accountNumber" TEXT, "accountName" TEXT, "bankName" TEXT, "bankSlug" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true, "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DedicatedAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IncomingTransfer" (
  "id" TEXT NOT NULL, "dedicatedAccountId" TEXT, "reference" TEXT NOT NULL,
  "amount" INTEGER NOT NULL, "currency" TEXT, "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
  "providerEventId" TEXT, "payload" JSONB, "matchedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncomingTransfer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DedicatedAccount_professionalId_key" ON "DedicatedAccount"("professionalId");
CREATE UNIQUE INDEX "DedicatedAccount_walletId_key" ON "DedicatedAccount"("walletId");
CREATE UNIQUE INDEX "DedicatedAccount_paystackAccountId_key" ON "DedicatedAccount"("paystackAccountId");
CREATE UNIQUE INDEX "DedicatedAccount_accountNumber_key" ON "DedicatedAccount"("accountNumber");
CREATE INDEX "DedicatedAccount_paystackCustomerCode_idx" ON "DedicatedAccount"("paystackCustomerCode");
CREATE UNIQUE INDEX "IncomingTransfer_reference_key" ON "IncomingTransfer"("reference");
CREATE UNIQUE INDEX "IncomingTransfer_providerEventId_key" ON "IncomingTransfer"("providerEventId");
CREATE INDEX "IncomingTransfer_status_createdAt_idx" ON "IncomingTransfer"("status","createdAt");
ALTER TABLE "DedicatedAccount" ADD CONSTRAINT "DedicatedAccount_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DedicatedAccount" ADD CONSTRAINT "DedicatedAccount_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncomingTransfer" ADD CONSTRAINT "IncomingTransfer_dedicatedAccountId_fkey" FOREIGN KEY ("dedicatedAccountId") REFERENCES "DedicatedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
