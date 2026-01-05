/*
  Warnings:

  - You are about to drop the column `PostType` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `contentId` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `postId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_contentId_fkey";

-- DropIndex
DROP INDEX "Comment_PostType_contentId_createdAt_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "PostType",
DROP COLUMN "contentId",
ADD COLUMN     "postId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
