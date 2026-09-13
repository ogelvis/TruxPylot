CREATE TABLE "JobPosting" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "budget" INTEGER,
  "deadline" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JobInterest" (
  "id" TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "jobGiverId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobInterest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "JobInterest_jobPostingId_professionalId_key" ON "JobInterest"("jobPostingId", "professionalId");
CREATE INDEX "JobPosting_customerId_status_createdAt_idx" ON "JobPosting"("customerId", "status", "createdAt");
CREATE INDEX "JobPosting_status_createdAt_idx" ON "JobPosting"("status", "createdAt");
CREATE INDEX "JobInterest_jobGiverId_createdAt_idx" ON "JobInterest"("jobGiverId", "createdAt");
CREATE INDEX "JobInterest_professionalId_createdAt_idx" ON "JobInterest"("professionalId", "createdAt");
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobInterest" ADD CONSTRAINT "JobInterest_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobInterest" ADD CONSTRAINT "JobInterest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobInterest" ADD CONSTRAINT "JobInterest_jobGiverId_fkey" FOREIGN KEY ("jobGiverId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
