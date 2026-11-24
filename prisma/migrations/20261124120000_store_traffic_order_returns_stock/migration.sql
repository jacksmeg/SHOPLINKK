-- CreateEnum
CREATE TYPE "OrderReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'REFUNDED', 'CLOSED');

-- AlterTable
ALTER TABLE "MarketplaceOrder" ADD COLUMN     "stockReserved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrderReturn" (
    "id" TEXT NOT NULL,
    "orderKind" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "OrderReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "sellerNote" TEXT,
    "adminNote" TEXT,
    "refundAmount" DECIMAL(12,2),
    "refundReference" TEXT,
    "orderAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTrafficDaily" (
    "storeId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreTrafficDaily_pkey" PRIMARY KEY ("storeId","day")
);

-- CreateIndex
CREATE INDEX "OrderReturn_sellerId_createdAt_idx" ON "OrderReturn"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderReturn_buyerId_createdAt_idx" ON "OrderReturn"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderReturn_status_createdAt_idx" ON "OrderReturn"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderReturn_orderKind_orderId_key" ON "OrderReturn"("orderKind", "orderId");

-- AddForeignKey
ALTER TABLE "StoreTrafficDaily" ADD CONSTRAINT "StoreTrafficDaily_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
