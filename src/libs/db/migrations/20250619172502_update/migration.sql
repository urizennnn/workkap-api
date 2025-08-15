-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYPAL', 'VISA_CARD', 'MASTER_CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ACTIVE', 'PENDING', 'COMPLETED', 'LATE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GigStatus" AS ENUM ('ACTIVE', 'PENDING', 'REQUIRES_MODIFICATION', 'DRAFT', 'DENIED', 'PAUSED');

-- DropForeignKey
ALTER TABLE "gigs" DROP CONSTRAINT "gigs_userId_fkey";

-- AlterTable
ALTER TABLE "gigs" ADD COLUMN     "status" "GigStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "freelancers" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,

    CONSTRAINT "freelancers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "payment" "PaymentMethod" NOT NULL,
    "note" VARCHAR(500),
    "status" "OrderStatus" NOT NULL DEFAULT 'ACTIVE',
    "total" INTEGER NOT NULL DEFAULT 1,
    "modeOfWorkingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mode_of_workings" (
    "id" TEXT NOT NULL,

    CONSTRAINT "mode_of_workings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_rates" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "maxAmount" DECIMAL(10,2) NOT NULL,
    "modeOfWorkingId" TEXT NOT NULL,

    CONSTRAINT "hourly_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "modeOfWorkingId" TEXT NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "freelancers_uid_key" ON "freelancers"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "clients_uid_key" ON "clients"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "orders_modeOfWorkingId_key" ON "orders"("modeOfWorkingId");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_rates_modeOfWorkingId_key" ON "hourly_rates"("modeOfWorkingId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_modeOfWorkingId_key" ON "contracts"("modeOfWorkingId");

-- AddForeignKey
ALTER TABLE "freelancers" ADD CONSTRAINT "freelancers_uid_fkey" FOREIGN KEY ("uid") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_uid_fkey" FOREIGN KEY ("uid") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "freelancers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_modeOfWorkingId_fkey" FOREIGN KEY ("modeOfWorkingId") REFERENCES "mode_of_workings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_rates" ADD CONSTRAINT "hourly_rates_modeOfWorkingId_fkey" FOREIGN KEY ("modeOfWorkingId") REFERENCES "mode_of_workings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_modeOfWorkingId_fkey" FOREIGN KEY ("modeOfWorkingId") REFERENCES "mode_of_workings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
