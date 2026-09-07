ALTER TABLE "Quote"
ADD COLUMN "priceType" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN "estimatedDuration" TEXT,
ADD COLUMN "availableAt" TIMESTAMP(3),
ADD COLUMN "message" TEXT,
ADD COLUMN "workDescription" TEXT;
