CREATE TABLE "InstantAdvertPurchase" (
  "id" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "durationMonths" INTEGER NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerEventId" TEXT,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstantAdvertPurchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InstantAdvertPurchase_reference_key" ON "InstantAdvertPurchase"("reference");
CREATE UNIQUE INDEX "InstantAdvertPurchase_providerEventId_key" ON "InstantAdvertPurchase"("providerEventId");
CREATE INDEX "InstantAdvertPurchase_professionalId_status_idx" ON "InstantAdvertPurchase"("professionalId", "status");
CREATE INDEX "InstantAdvertPurchase_status_expiresAt_idx" ON "InstantAdvertPurchase"("status", "expiresAt");
ALTER TABLE "InstantAdvertPurchase" ADD CONSTRAINT "InstantAdvertPurchase_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
