/*
  Warnings:

  - Made the column `userCreatorId` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userCreatorId_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "userCreatorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
