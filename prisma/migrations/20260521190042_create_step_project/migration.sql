-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "stepId" TEXT;

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Step_projectId_idx" ON "Step"("projectId");

-- CreateIndex
CREATE INDEX "Task_stepId_idx" ON "Task"("stepId");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
