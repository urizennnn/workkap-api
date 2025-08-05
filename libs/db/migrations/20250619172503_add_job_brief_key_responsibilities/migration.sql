ALTER TABLE "orders" ADD COLUMN "jobBrief" VARCHAR(500);
ALTER TABLE "orders" ADD COLUMN "keyResponsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[];
