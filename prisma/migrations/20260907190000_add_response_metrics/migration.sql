ALTER TABLE "ServiceRequest"
ADD COLUMN "requiresProfessionalResponse" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "responseExcluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "responseExclusionReason" TEXT,
ADD COLUMN "responseAvailableAt" TIMESTAMP(3),
ADD COLUMN "professionalRespondedAt" TIMESTAMP(3);
