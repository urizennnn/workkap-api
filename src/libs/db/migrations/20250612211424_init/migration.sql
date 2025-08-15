-- CreateEnum
CREATE TYPE "RegistrationMethod" AS ENUM ('COMBINATION', 'GOOGLE', 'FACEBOOK', 'APPLE');

-- CreateTable
CREATE TABLE "User" (
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
