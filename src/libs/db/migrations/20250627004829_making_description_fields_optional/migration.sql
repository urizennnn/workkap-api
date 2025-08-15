/*
  Warnings:

  - You are about to alter the column `description` on the `GigPackage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "GigPackage" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "gigs" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" SET DEFAULT '';
