-- CreateEnum
CREATE TYPE "ApiProvider" AS ENUM ('GOOGLE_ADWORDS', 'FACEBOOK_ADS', 'TWITTER_ADS', 'LINKEDIN_ADS');

-- CreateEnum
CREATE TYPE "ApiConfigStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateTable
CREATE TABLE "ApiConfiguration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "ApiProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "developerToken" TEXT,
    "apiKey" TEXT,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "status" "ApiConfigStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiConfiguration_userId_provider_key" ON "ApiConfiguration"("userId", "provider");

-- AddForeignKey
ALTER TABLE "ApiConfiguration" ADD CONSTRAINT "ApiConfiguration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
