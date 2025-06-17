/*
  Warnings:

  - You are about to drop the `Gig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExtraService" DROP CONSTRAINT "ExtraService_gigId_fkey";

-- DropForeignKey
ALTER TABLE "Gig" DROP CONSTRAINT "Gig_userId_fkey";

-- DropForeignKey
ALTER TABLE "GigPackage" DROP CONSTRAINT "GigPackage_gigId_fkey";

-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_gigId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_gigId_fkey";

-- DropTable
DROP TABLE "Gig";

-- CreateTable
CREATE TABLE "gigs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mainCategory" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" VARCHAR(1000) NOT NULL,
    "thirdPartyAgreement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gigs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gigs_slug_key" ON "gigs"("slug");

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigPackage" ADD CONSTRAINT "GigPackage_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraService" ADD CONSTRAINT "ExtraService_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
