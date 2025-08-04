/*
  Warnings:

  - A unique constraint covering the columns `[chatRoomId]` on the table `Party` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatRoomId]` on the table `Quest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Badge" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "requirement" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Party" ADD COLUMN     "chatRoomId" TEXT;

-- AlterTable
ALTER TABLE "public"."Quest" ADD COLUMN     "chatRoomId" TEXT;

-- AlterTable
ALTER TABLE "public"."Title" ADD COLUMN     "requiredBadges" TEXT[],
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "requirement" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questId" TEXT,
    "partyId" TEXT,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatParticipant" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_questId_key" ON "public"."ChatRoom"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_partyId_key" ON "public"."ChatRoom"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatRoomId_userId_key" ON "public"."ChatParticipant"("chatRoomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Party_chatRoomId_key" ON "public"."Party"("chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_chatRoomId_key" ON "public"."Quest"("chatRoomId");

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_questId_fkey" FOREIGN KEY ("questId") REFERENCES "public"."Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
