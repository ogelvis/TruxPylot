-- TruxPylot scale-safe indexes.
-- Additive only; no production data is modified or deleted.

CREATE INDEX IF NOT EXISTS "User_role_status_createdAt_idx"
ON "User"("role", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "User_createdAt_idx"
ON "User"("createdAt");

CREATE INDEX IF NOT EXISTS "Professional_verificationStatus_state_city_idx"
ON "Professional"("verificationStatus", "state", "city");

CREATE INDEX IF NOT EXISTS "Professional_state_city_idx"
ON "Professional"("state", "city");

CREATE INDEX IF NOT EXISTS "ProfessionalService_categoryId_professionalId_idx"
ON "ProfessionalService"("categoryId", "professionalId");

CREATE INDEX IF NOT EXISTS "ServiceRequest_customerId_createdAt_idx"
ON "ServiceRequest"("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "ServiceRequest_professionalId_createdAt_idx"
ON "ServiceRequest"("professionalId", "createdAt");
