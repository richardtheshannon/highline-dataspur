-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApiActivityType" ADD VALUE 'METRICS_SYNC';
ALTER TYPE "ApiActivityType" ADD VALUE 'CAMPAIGN_SYNC';
ALTER TYPE "ApiActivityType" ADD VALUE 'BACKGROUND_SYNC';

-- CreateTable
CREATE TABLE "GoogleAdsCampaign" (
    "id" TEXT NOT NULL,
    "apiConfigId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAdsCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAdsMetrics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageCpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAdsMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsCampaign_apiConfigId_campaignId_key" ON "GoogleAdsCampaign"("apiConfigId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsMetrics_campaignId_date_key" ON "GoogleAdsMetrics"("campaignId", "date");

-- AddForeignKey
ALTER TABLE "GoogleAdsCampaign" ADD CONSTRAINT "GoogleAdsCampaign_apiConfigId_fkey" FOREIGN KEY ("apiConfigId") REFERENCES "ApiConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAdsMetrics" ADD CONSTRAINT "GoogleAdsMetrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GoogleAdsCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
