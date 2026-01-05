/*
  Warnings:

  - You are about to drop the column `interest` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `photoURL` on the `UserInterest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,interestId]` on the table `UserInterest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `interestId` to the `UserInterest` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserInterest_userId_key";

-- AlterTable
ALTER TABLE "UserInterest" DROP COLUMN "interest",
DROP COLUMN "photoURL",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "interestId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "canvasUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interest_title_key" ON "Interest"("title");

-- CreateIndex
CREATE INDEX "Interest_title_idx" ON "Interest"("title");

-- CreateIndex
CREATE INDEX "UserInterest_interestId_idx" ON "UserInterest"("interestId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_userId_interestId_key" ON "UserInterest"("userId", "interestId");

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
