-- CreateTable
CREATE TABLE "GoogleAdsCampaignGoal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "targetCPA" DOUBLE PRECISION,
    "targetROAS" DOUBLE PRECISION,
    "dailyBudget" DOUBLE PRECISION,
    "monthlyBudget" DOUBLE PRECISION,
    "targetCTR" DOUBLE PRECISION,
    "targetCVR" DOUBLE PRECISION,
    "targetConversions" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAdsCampaignGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsCampaignGoal_campaignId_key" ON "GoogleAdsCampaignGoal"("campaignId");

-- AddForeignKey
ALTER TABLE "GoogleAdsCampaignGoal" ADD CONSTRAINT "GoogleAdsCampaignGoal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GoogleAdsCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
