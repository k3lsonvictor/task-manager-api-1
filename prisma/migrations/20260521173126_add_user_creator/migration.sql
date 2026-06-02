-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "userCreatorId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
