CREATE TYPE "BusinessTeamRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SUPPORT');
CREATE TYPE "BusinessTeamStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT,
    "email" TEXT NOT NULL,
    "role" "BusinessTeamRole" NOT NULL DEFAULT 'STAFF',
    "status" "BusinessTeamStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamMember_businessId_email_key" ON "TeamMember"("businessId", "email");
CREATE UNIQUE INDEX "TeamMember_businessId_professionalId_key" ON "TeamMember"("businessId", "professionalId");
CREATE INDEX "TeamMember_businessId_status_idx" ON "TeamMember"("businessId", "status");
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
