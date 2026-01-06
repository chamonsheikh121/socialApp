/*
  Warnings:

  - You are about to drop the column `PostType` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `postType` on the `Post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,contentId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Bookmark_PostType_contentId_idx";

-- DropIndex
DROP INDEX "Bookmark_userId_PostType_contentId_key";

-- DropIndex
DROP INDEX "Post_postType_idx";

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "PostType";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "pagePostId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PagePost" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "postType";

-- AlterTable
ALTER TABLE "PostCategory" ADD COLUMN     "pagePostId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PostHashtag" ADD COLUMN     "pagePostId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- DropEnum
DROP TYPE "PostType";

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "mentionedBy" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mention_mentionedUserId_idx" ON "Mention"("mentionedUserId");

-- CreateIndex
CREATE INDEX "Mention_mentionedBy_idx" ON "Mention"("mentionedBy");

-- CreateIndex
CREATE INDEX "Mention_postId_idx" ON "Mention"("postId");

-- CreateIndex
CREATE INDEX "Mention_commentId_idx" ON "Mention"("commentId");

-- CreateIndex
CREATE INDEX "Bookmark_contentId_idx" ON "Bookmark"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_key" ON "Bookmark"("userId", "contentId");

-- CreateIndex
CREATE INDEX "PagePost_createdAt_idx" ON "PagePost"("createdAt");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_mentionedBy_fkey" FOREIGN KEY ("mentionedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
