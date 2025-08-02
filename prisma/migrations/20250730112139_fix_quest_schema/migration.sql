/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `rewardType` on the `Quest` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Quest` table without a default value. This is not possible if the table is not empty.
  - Made the column `location` on table `Quest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Quest" DROP CONSTRAINT "Quest_createdBy_fkey";

-- AlterTable
ALTER TABLE "public"."Quest" DROP COLUMN "createdBy",
DROP COLUMN "deadline",
DROP COLUMN "difficulty",
DROP COLUMN "rewardType",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Quest" ADD CONSTRAINT "Quest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
