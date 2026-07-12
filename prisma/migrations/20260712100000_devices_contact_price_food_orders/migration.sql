CREATE TYPE "PriceMode" AS ENUM ('FIXED', 'CONTACT');
CREATE TYPE "StoreKind" AS ENUM ('GENERAL', 'FOOD');
CREATE TYPE "FoodOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

ALTER TABLE "Product"
ADD COLUMN "priceMode" "PriceMode" NOT NULL DEFAULT 'FIXED';

ALTER TABLE "Store"
ADD COLUMN "kind" "StoreKind" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "momoNumber" TEXT;

CREATE TABLE "TrustedDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "label" TEXT,
  "userAgent" TEXT,
  "platform" TEXT,
  "timezone" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodMenuItem" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "basePrice" DECIMAL(12, 2) NOT NULL,
  "imageUrl" TEXT,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodMenuItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodMenuOption" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodMenuOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOrder" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "status" "FoodOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "buyerName" TEXT,
  "buyerPhone" TEXT,
  "deliveryAddress" TEXT,
  "deliveryNote" TEXT,
  "paymentReference" TEXT,
  "sellerPaymentNote" TEXT,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "paymentConfirmedAt" TIMESTAMP(3),
  "outForDeliveryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12, 2) NOT NULL,
  "options" JSONB,
  "lineTotal" DECIMAL(12, 2) NOT NULL,
  CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreFollower" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreFollower_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrustedDevice_userId_deviceId_key" ON "TrustedDevice"("userId", "deviceId");
CREATE INDEX "TrustedDevice_userId_lastSeenAt_idx" ON "TrustedDevice"("userId", "lastSeenAt");
CREATE INDEX "Product_priceMode_idx" ON "Product"("priceMode");
CREATE INDEX "FoodMenuItem_storeId_isAvailable_idx" ON "FoodMenuItem"("storeId", "isAvailable");
CREATE INDEX "FoodMenuOption_itemId_idx" ON "FoodMenuOption"("itemId");
CREATE INDEX "FoodOrder_storeId_status_idx" ON "FoodOrder"("storeId", "status");
CREATE INDEX "FoodOrder_buyerId_createdAt_idx" ON "FoodOrder"("buyerId", "createdAt");
CREATE INDEX "FoodOrderItem_orderId_idx" ON "FoodOrderItem"("orderId");
CREATE INDEX "FoodOrderItem_itemId_idx" ON "FoodOrderItem"("itemId");
CREATE UNIQUE INDEX "StoreFollower_userId_storeId_key" ON "StoreFollower"("userId", "storeId");
CREATE INDEX "StoreFollower_storeId_createdAt_idx" ON "StoreFollower"("storeId", "createdAt");
CREATE INDEX "StoreFollower_userId_createdAt_idx" ON "StoreFollower"("userId", "createdAt");

ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuOption" ADD CONSTRAINT "FoodMenuOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreFollower" ADD CONSTRAINT "StoreFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreFollower" ADD CONSTRAINT "StoreFollower_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
