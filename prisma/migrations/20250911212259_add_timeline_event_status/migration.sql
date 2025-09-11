-- CreateEnum
CREATE TYPE "TimelineEventStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "TimelineEvent" ADD COLUMN     "status" "TimelineEventStatus" NOT NULL DEFAULT 'PENDING';
