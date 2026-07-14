-- Direct seller Mobile Money payments for food and marketplace orders.
CREATE TYPE "DirectPaymentStatus" AS ENUM ('AWAITING_PAYMENT', 'SUBMITTED', 'CONFIRMED', 'REJECTED', 'CANCELLED');

CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAID', 'READY', 'DELIVERED', 'CANCELLED');

ALTER TABLE "FoodOrder"
ADD COLUMN "directPaymentStatus" "DirectPaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
ADD COLUMN "paymentProofUrl" TEXT,
ADD COLUMN "buyerPaymentNote" TEXT,
ADD COLUMN "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN "paymentRejectedReason" TEXT;

CREATE TABLE "MarketplaceOrder" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT,
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "directPaymentStatus" "DirectPaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "buyerName" TEXT,
    "buyerPhone" TEXT,
    "deliveryAddress" TEXT,
    "deliveryNote" TEXT,
    "paymentReference" TEXT,
    "paymentProofUrl" TEXT,
    "buyerPaymentNote" TEXT,
    "sellerPaymentNote" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "MarketplaceOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FoodOrder_directPaymentStatus_createdAt_idx" ON "FoodOrder"("directPaymentStatus", "createdAt");
CREATE INDEX "MarketplaceOrder_buyerId_createdAt_idx" ON "MarketplaceOrder"("buyerId", "createdAt");
CREATE INDEX "MarketplaceOrder_sellerId_status_idx" ON "MarketplaceOrder"("sellerId", "status");
CREATE INDEX "MarketplaceOrder_storeId_createdAt_idx" ON "MarketplaceOrder"("storeId", "createdAt");
CREATE INDEX "MarketplaceOrder_directPaymentStatus_createdAt_idx" ON "MarketplaceOrder"("directPaymentStatus", "createdAt");
CREATE INDEX "MarketplaceOrderItem_orderId_idx" ON "MarketplaceOrderItem"("orderId");
CREATE INDEX "MarketplaceOrderItem_productId_idx" ON "MarketplaceOrderItem"("productId");

ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderItem" ADD CONSTRAINT "MarketplaceOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderItem" ADD CONSTRAINT "MarketplaceOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
