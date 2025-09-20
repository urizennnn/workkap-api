-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "contextKey" TEXT NOT NULL DEFAULT 'default';

-- DropIndex
DROP INDEX IF EXISTS "pair_unique";

-- CreateIndex
CREATE UNIQUE INDEX "pair_context_unique" ON "conversations"("aId","bId","contextKey");
