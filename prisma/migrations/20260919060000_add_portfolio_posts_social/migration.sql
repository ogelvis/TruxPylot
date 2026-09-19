ALTER TABLE "PortfolioItem" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PortfolioItem" ALTER COLUMN "description" TYPE TEXT;

CREATE TABLE "PortfolioLike" (
    "id" TEXT NOT NULL,
    "portfolioItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioLike_portfolioItemId_userId_key" ON "PortfolioLike"("portfolioItemId", "userId");
CREATE INDEX "PortfolioLike_portfolioItemId_idx" ON "PortfolioLike"("portfolioItemId");
ALTER TABLE "PortfolioLike" ADD CONSTRAINT "PortfolioLike_portfolioItemId_fkey"
  FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PortfolioComment" (
    "id" TEXT NOT NULL,
    "portfolioItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioComment_portfolioItemId_createdAt_idx" ON "PortfolioComment"("portfolioItemId", "createdAt");
ALTER TABLE "PortfolioComment" ADD CONSTRAINT "PortfolioComment_portfolioItemId_fkey"
  FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
