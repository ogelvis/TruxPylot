-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Customer" ADD COLUMN "businessName" TEXT;
ALTER TABLE "Customer" ADD COLUMN "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Professional" ADD COLUMN "businessName" TEXT;
ALTER TABLE "Professional" ADD COLUMN "registrationNumber" TEXT;
