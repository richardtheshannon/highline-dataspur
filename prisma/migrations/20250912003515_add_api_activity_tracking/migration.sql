-- CreateEnum
CREATE TYPE "ApiActivityType" AS ENUM ('CONNECTION_TEST', 'DATA_SYNC', 'CAMPAIGN_FETCH', 'KEYWORD_UPDATE', 'RATE_LIMIT_WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "ApiActivityStatus" AS ENUM ('SUCCESS', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "ApiActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiConfigId" TEXT NOT NULL,
    "provider" "ApiProvider" NOT NULL,
    "type" "ApiActivityType" NOT NULL,
    "status" "ApiActivityStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApiActivity" ADD CONSTRAINT "ApiActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiActivity" ADD CONSTRAINT "ApiActivity_apiConfigId_fkey" FOREIGN KEY ("apiConfigId") REFERENCES "ApiConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
