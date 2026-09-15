ALTER TABLE "User" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'password';
ALTER TABLE "User" ADD COLUMN "googleSubject" TEXT;
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
