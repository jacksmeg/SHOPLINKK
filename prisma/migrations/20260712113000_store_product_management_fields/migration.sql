ALTER TABLE "Store"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "gpsLatitude" DOUBLE PRECISION,
  ADD COLUMN "gpsLongitude" DOUBLE PRECISION,
  ADD COLUMN "socialLinks" JSONB,
  ADD COLUMN "deliveryCoverage" TEXT,
  ADD COLUMN "announcementBanner" TEXT,
  ADD COLUMN "accentColor" TEXT,
  ADD COLUMN "storeTheme" TEXT,
  ADD COLUMN "acceptOrders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "vacationMode" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryAvailable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pickupAvailable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "callsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "weightKg" DOUBLE PRECISION,
  ADD COLUMN "deliveryOptions" TEXT;

CREATE INDEX "Product_sku_idx" ON "Product"("sku");
