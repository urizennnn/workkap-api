-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'STARTUP', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'STALE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FreelancerLevel" AS ENUM ('NEW_SELLER', 'RISING_TALENT', 'PRO_SELLER', 'TOP_RATED', 'ELITE_SELLER');

-- AlterTable
ALTER TABLE "freelancers" ADD COLUMN     "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" "FreelancerLevel" NOT NULL DEFAULT 'NEW_SELLER',
ADD COLUMN     "newSeller" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "nextSubscriptionDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" DEFAULT 'BASIC',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" DEFAULT 'STALE';
