-- Adds the one-time Professional Premium tier purchase table.
-- PaymentStatus enum already exists (created in the initial migration for
-- the job Payment model) — reused here rather than adding a duplicate enum.

CREATE TABLE "PremiumPurchase" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerEventId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PremiumPurchase_reference_key" ON "PremiumPurchase"("reference");
CREATE UNIQUE INDEX "PremiumPurchase_providerEventId_key" ON "PremiumPurchase"("providerEventId");
CREATE INDEX "PremiumPurchase_professionalId_status_idx" ON "PremiumPurchase"("professionalId", "status");

-- Duplicate-payment / one-time-purchase protection at the DB level:
-- a professional may have multiple PENDING/FAILED attempts (so a failed
-- or abandoned payment can be retried), but can never have more than one
-- SUCCESS row. This is intentionally a partial index (Prisma's schema
-- language can't express a WHERE clause on a unique index), which is why
-- it's not mirrored 1:1 in schema.prisma — same hand-written-SQL
-- convention already used for this project's other migrations.
CREATE UNIQUE INDEX "PremiumPurchase_one_success_per_professional"
    ON "PremiumPurchase"("professionalId")
    WHERE "status" = 'SUCCESS';

ALTER TABLE "PremiumPurchase" ADD CONSTRAINT "PremiumPurchase_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
