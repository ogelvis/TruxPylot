ALTER TYPE "UserStatus" ADD VALUE 'DELETED';

ALTER TABLE "User"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedEmail" TEXT,
  ADD COLUMN "deletedPhone" TEXT,
  ADD COLUMN "deletedGoogleSubject" TEXT;
