-- Product/service listings, quantity tracking, and payment billing foundation.

CREATE TYPE "ListingType" AS ENUM ('PRODUCT', 'SERVICE');
CREATE TYPE "ListingPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'WAIVED');
CREATE TYPE "BillingProvider" AS ENUM ('PAYSTACK', 'KORA');
CREATE TYPE "BillingPackageType" AS ENUM ('PRODUCT_LISTING', 'ADVERT');
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');
CREATE TYPE "PaymentPurpose" AS ENUM ('PRODUCT_LISTING', 'ADVERT');

ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'PAYSTACK';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'KORA';

ALTER TABLE "Product"
  ADD COLUMN "listingType" "ListingType" NOT NULL DEFAULT 'PRODUCT',
  ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "listingPaymentStatus" "ListingPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

ALTER TABLE "ProductBoostRequest"
  ADD COLUMN "billingPackageId" TEXT;

CREATE TABLE "BillingPackage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "BillingPackageType" NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',
  "durationDays" INTEGER,
  "listingCount" INTEGER,
  "placement" "AdvertPlacement",
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "packageId" TEXT,
  "provider" "BillingProvider" NOT NULL,
  "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "purpose" "PaymentPurpose" NOT NULL,
  "reference" TEXT NOT NULL,
  "providerReference" TEXT,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',
  "checkoutUrl" TEXT,
  "productId" TEXT,
  "boostRequestId" TEXT,
  "rawPayload" JSONB,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");
CREATE INDEX "Product_listingType_idx" ON "Product"("listingType");
CREATE INDEX "Product_listingPaymentStatus_idx" ON "Product"("listingPaymentStatus");
CREATE INDEX "ProductBoostRequest_billingPackageId_idx" ON "ProductBoostRequest"("billingPackageId");
CREATE INDEX "BillingPackage_type_isActive_sortOrder_idx" ON "BillingPackage"("type", "isActive", "sortOrder");
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");
CREATE INDEX "PaymentTransaction_packageId_idx" ON "PaymentTransaction"("packageId");
CREATE INDEX "PaymentTransaction_productId_idx" ON "PaymentTransaction"("productId");
CREATE INDEX "PaymentTransaction_boostRequestId_idx" ON "PaymentTransaction"("boostRequestId");
CREATE INDEX "PaymentTransaction_provider_status_idx" ON "PaymentTransaction"("provider", "status");
CREATE INDEX "PaymentTransaction_purpose_status_idx" ON "PaymentTransaction"("purpose", "status");

ALTER TABLE "ProductBoostRequest"
  ADD CONSTRAINT "ProductBoostRequest_billingPackageId_fkey"
  FOREIGN KEY ("billingPackageId") REFERENCES "BillingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BillingPackage"
  ADD CONSTRAINT "BillingPackage_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PaymentTransaction_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "BillingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PaymentTransaction_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PaymentTransaction_boostRequestId_fkey"
  FOREIGN KEY ("boostRequestId") REFERENCES "ProductBoostRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

