ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RIDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'RIDER_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'RIDER_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'RIDER_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DELIVERY_ASSIGNED';

CREATE TYPE "RiderVerificationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "RiderAvailability" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY', 'ON_DELIVERY');
CREATE TYPE "RiderVehicleType" AS ENUM ('MOTORCYCLE', 'TRICYCLE', 'CAR', 'VAN');
CREATE TYPE "DeliveryRequestStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "DeliveryStatus" AS ENUM ('WAITING_FOR_RIDER', 'ACCEPTED', 'HEADING_TO_SELLER', 'ITEM_PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "DeliveryReportReason" AS ENUM ('LATE_DELIVERY', 'MISSING_ITEM', 'DAMAGED_PACKAGE', 'RIDER_MISCONDUCT', 'OTHER');

CREATE TABLE "RiderProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "RiderVerificationStatus" NOT NULL DEFAULT 'DRAFT',
  "availability" "RiderAvailability" NOT NULL DEFAULT 'OFFLINE',
  "vehicleType" "RiderVehicleType",
  "profilePhotoUrl" TEXT,
  "ghanaCardUrl" TEXT,
  "licenseUrl" TEXT,
  "vehicleDocumentUrl" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "momoName" TEXT,
  "momoNumber" TEXT,
  "bankName" TEXT,
  "bankAccountName" TEXT,
  "bankAccountNumber" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "lastLocationAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "suspensionReason" TEXT,
  "approvedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RiderProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryRequest" (
  "id" TEXT NOT NULL,
  "foodOrderId" TEXT,
  "storeId" TEXT,
  "sellerId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "riderId" TEXT,
  "status" "DeliveryRequestStatus" NOT NULL DEFAULT 'OPEN',
  "pickupName" TEXT,
  "pickupPhone" TEXT,
  "pickupAddress" TEXT NOT NULL,
  "pickupLatitude" DOUBLE PRECISION,
  "pickupLongitude" DOUBLE PRECISION,
  "deliveryName" TEXT,
  "deliveryPhone" TEXT,
  "deliveryAddress" TEXT NOT NULL,
  "deliveryLatitude" DOUBLE PRECISION,
  "deliveryLongitude" DOUBLE PRECISION,
  "productName" TEXT NOT NULL,
  "deliveryFee" DECIMAL(12,2) NOT NULL,
  "distanceKm" DOUBLE PRECISION,
  "estimatedMinutes" INTEGER,
  "note" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Delivery" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "riderId" TEXT NOT NULL,
  "foodOrderId" TEXT,
  "sellerId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'WAITING_FOR_RIDER',
  "deliveryFee" DECIMAL(12,2) NOT NULL,
  "distanceKm" DOUBLE PRECISION,
  "estimatedMinutes" INTEGER,
  "acceptedAt" TIMESTAMP(3),
  "headingToSellerAt" TIMESTAMP(3),
  "pickedUpAt" TIMESTAMP(3),
  "onTheWayAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "buyerConfirmedAt" TIMESTAMP(3),
  "sellerConfirmedAt" TIMESTAMP(3),
  "riderLatitude" DOUBLE PRECISION,
  "riderLongitude" DOUBLE PRECISION,
  "riderLocationAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiderLocationPing" (
  "id" TEXT NOT NULL,
  "riderId" TEXT NOT NULL,
  "deliveryId" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "heading" DOUBLE PRECISION,
  "speed" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiderLocationPing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiderRating" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "riderId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiderRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryReport" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "riderId" TEXT,
  "reporterId" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reason" "DeliveryReportReason" NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RiderProfile_userId_key" ON "RiderProfile"("userId");
CREATE INDEX "RiderProfile_status_availability_idx" ON "RiderProfile"("status", "availability");
CREATE INDEX "RiderProfile_vehicleType_idx" ON "RiderProfile"("vehicleType");

CREATE UNIQUE INDEX "Delivery_requestId_key" ON "Delivery"("requestId");
CREATE UNIQUE INDEX "RiderRating_authorId_deliveryId_key" ON "RiderRating"("authorId", "deliveryId");

CREATE INDEX "DeliveryRequest_status_createdAt_idx" ON "DeliveryRequest"("status", "createdAt");
CREATE INDEX "DeliveryRequest_riderId_status_idx" ON "DeliveryRequest"("riderId", "status");
CREATE INDEX "DeliveryRequest_foodOrderId_idx" ON "DeliveryRequest"("foodOrderId");
CREATE INDEX "DeliveryRequest_sellerId_createdAt_idx" ON "DeliveryRequest"("sellerId", "createdAt");
CREATE INDEX "DeliveryRequest_buyerId_createdAt_idx" ON "DeliveryRequest"("buyerId", "createdAt");

CREATE INDEX "Delivery_riderId_status_idx" ON "Delivery"("riderId", "status");
CREATE INDEX "Delivery_buyerId_createdAt_idx" ON "Delivery"("buyerId", "createdAt");
CREATE INDEX "Delivery_sellerId_createdAt_idx" ON "Delivery"("sellerId", "createdAt");
CREATE INDEX "Delivery_status_createdAt_idx" ON "Delivery"("status", "createdAt");
CREATE INDEX "Delivery_foodOrderId_idx" ON "Delivery"("foodOrderId");

CREATE INDEX "RiderLocationPing_riderId_createdAt_idx" ON "RiderLocationPing"("riderId", "createdAt");
CREATE INDEX "RiderLocationPing_deliveryId_createdAt_idx" ON "RiderLocationPing"("deliveryId", "createdAt");
CREATE INDEX "RiderRating_riderId_createdAt_idx" ON "RiderRating"("riderId", "createdAt");
CREATE INDEX "DeliveryReport_status_createdAt_idx" ON "DeliveryReport"("status", "createdAt");
CREATE INDEX "DeliveryReport_riderId_createdAt_idx" ON "DeliveryReport"("riderId", "createdAt");
CREATE INDEX "DeliveryReport_reporterId_createdAt_idx" ON "DeliveryReport"("reporterId", "createdAt");

ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DeliveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RiderLocationPing" ADD CONSTRAINT "RiderLocationPing_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiderLocationPing" ADD CONSTRAINT "RiderLocationPing_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryReport" ADD CONSTRAINT "DeliveryReport_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryReport" ADD CONSTRAINT "DeliveryReport_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryReport" ADD CONSTRAINT "DeliveryReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryReport" ADD CONSTRAINT "DeliveryReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
