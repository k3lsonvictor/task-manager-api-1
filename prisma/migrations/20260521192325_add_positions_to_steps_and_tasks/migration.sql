-- DropIndex
DROP INDEX "Step_projectId_idx";

-- DropIndex
DROP INDEX "Task_stepId_idx";

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Step_projectId_position_idx" ON "Step"("projectId", "position");

-- CreateIndex
CREATE INDEX "Task_stepId_position_idx" ON "Task"("stepId", "position");
