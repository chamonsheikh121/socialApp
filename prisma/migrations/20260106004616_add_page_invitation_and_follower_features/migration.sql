-- CreateTable
CREATE TABLE "PageFollower" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageInvitation" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageFollower_pageId_idx" ON "PageFollower"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageFollower_pageId_userId_key" ON "PageFollower"("pageId", "userId");

-- CreateIndex
CREATE INDEX "PageInvitation_receiverId_idx" ON "PageInvitation"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "PageInvitation_pageId_senderId_receiverId_key" ON "PageInvitation"("pageId", "senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "PageFollower" ADD CONSTRAINT "PageFollower_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageFollower" ADD CONSTRAINT "PageFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageInvitation" ADD CONSTRAINT "PageInvitation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageInvitation" ADD CONSTRAINT "PageInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageInvitation" ADD CONSTRAINT "PageInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
