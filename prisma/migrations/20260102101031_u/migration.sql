/*
  Warnings:

  - You are about to drop the column `category` on the `UserInterest` table. All the data in the column will be lost.
  - Added the required column `photoURL` to the `UserInterest` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserInterest_category_idx";

-- AlterTable
ALTER TABLE "UserInterest" DROP COLUMN "category",
ADD COLUMN     "interest" TEXT[],
ADD COLUMN     "photoURL" TEXT NOT NULL;
