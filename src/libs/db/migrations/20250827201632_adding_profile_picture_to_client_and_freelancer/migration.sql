/*
  Warnings:

  - You are about to drop the column `profilePictureUrl` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "profilePictureUrl" TEXT;

-- AlterTable
ALTER TABLE "freelancers" ADD COLUMN     "profilePictureUrl" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "profilePictureUrl";
