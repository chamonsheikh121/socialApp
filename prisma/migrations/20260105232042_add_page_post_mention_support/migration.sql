-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('USER_POST', 'PAGE_POST', 'USER_REEL', 'PAGE_REEL', 'USER_VIDEO', 'PAGE_VIDEO');

-- AlterTable
ALTER TABLE "Mention" ADD COLUMN     "pagePostId" TEXT;

-- AlterTable
ALTER TABLE "PostCategory" ADD COLUMN     "postType" "PostType" NOT NULL DEFAULT 'USER_POST';

-- CreateIndex
CREATE INDEX "Mention_pagePostId_idx" ON "Mention"("pagePostId");

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
