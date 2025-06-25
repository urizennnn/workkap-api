/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "country" TEXT,
    "profilePictureUrl" TEXT,
    "username" TEXT,
    "fullName" TEXT,
    "registrationMethod" "RegistrationMethod" NOT NULL DEFAULT 'COMBINATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gigs" (
    "id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "GigPackage" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "tier" "PackageTier" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deliveryTime" TEXT NOT NULL,
    "customAssetDesign" BOOLEAN NOT NULL DEFAULT false,
    "sourceFile" BOOLEAN NOT NULL DEFAULT false,
    "contentUpload" BOOLEAN NOT NULL DEFAULT false,
    "convertToHtmlCss" BOOLEAN NOT NULL DEFAULT false,
    "revisions" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "GigPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraService" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryTime" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ExtraService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

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
