-- CreateEnum
CREATE TYPE "AdvertExtensionStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ProductBoostRequest"
ADD COLUMN "extensionStatus" "AdvertExtensionStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "extensionDays" INTEGER,
ADD COLUMN "extensionNote" TEXT,
ADD COLUMN "extensionRequestedAt" TIMESTAMP(3),
ADD COLUMN "extensionReviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdvertImage" (
    "id" TEXT NOT NULL,
    "boostRequestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvertImage_boostRequestId_sortOrder_idx" ON "AdvertImage"("boostRequestId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AdvertImage" ADD CONSTRAINT "AdvertImage_boostRequestId_fkey" FOREIGN KEY ("boostRequestId") REFERENCES "ProductBoostRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
