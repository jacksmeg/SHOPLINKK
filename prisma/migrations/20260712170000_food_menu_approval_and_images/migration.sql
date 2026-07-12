CREATE TYPE "FoodMenuStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "FoodMenuItem"
ADD COLUMN "status" "FoodMenuStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "category" TEXT,
ADD COLUMN "prepMinutes" INTEGER,
ADD COLUMN "isSpicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3);

CREATE TABLE "FoodMenuImage" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodMenuImage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FoodMenuImage" ("id", "itemId", "url", "alt", "sortOrder")
SELECT concat('foodimg_', "id"), "id", "imageUrl", "name", 0
FROM "FoodMenuItem"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';

CREATE INDEX "FoodMenuItem_status_isAvailable_idx" ON "FoodMenuItem"("status", "isAvailable");
CREATE INDEX "FoodMenuImage_itemId_sortOrder_idx" ON "FoodMenuImage"("itemId", "sortOrder");

ALTER TABLE "FoodMenuImage" ADD CONSTRAINT "FoodMenuImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
