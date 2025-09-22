-- CreateTable
CREATE TABLE "GeneralTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneralTask_userId_idx" ON "GeneralTask"("userId");

-- CreateIndex
CREATE INDEX "GeneralTask_userId_completed_idx" ON "GeneralTask"("userId", "completed");

-- CreateIndex
CREATE INDEX "GeneralTask_userId_dueDate_idx" ON "GeneralTask"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "GeneralTask" ADD CONSTRAINT "GeneralTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
