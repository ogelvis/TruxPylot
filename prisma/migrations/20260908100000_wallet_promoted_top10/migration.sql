CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "WalletTransactionSource" AS ENUM ('FUNDING', 'JOB_EARNING', 'REFERRAL_REWARD', 'PROMOTED_TOP10', 'WITHDRAWAL', 'ADJUSTMENT');
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "source" "WalletTransactionSource" NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "amount" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "reference" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON "WalletTransaction"("reference");
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId","createdAt");
CREATE INDEX "WalletTransaction_source_status_idx" ON "WalletTransaction"("source","status");
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WalletFunding" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WalletFunding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletFunding_reference_key" ON "WalletFunding"("reference");
CREATE UNIQUE INDEX "WalletFunding_providerEventId_key" ON "WalletFunding"("providerEventId");
CREATE INDEX "WalletFunding_walletId_status_idx" ON "WalletFunding"("walletId","status");
ALTER TABLE "WalletFunding" ADD CONSTRAINT "WalletFunding_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PromotedProduct" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromotedProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromotedProduct_durationDays_key" ON "PromotedProduct"("durationDays");

CREATE TABLE "PromotedListing" (
  "id" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "transactionId" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotedListing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromotedListing_transactionId_key" ON "PromotedListing"("transactionId");
CREATE INDEX "PromotedListing_active_expiresAt_idx" ON "PromotedListing"("active","expiresAt");
CREATE INDEX "PromotedListing_professionalId_active_idx" ON "PromotedListing"("professionalId","active");
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PromotedProduct"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
