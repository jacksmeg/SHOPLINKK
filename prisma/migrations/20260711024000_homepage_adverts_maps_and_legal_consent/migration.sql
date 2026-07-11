ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_MAPS';

CREATE TYPE "AdvertPlacement" AS ENUM ('HOMEPAGE', 'MARKETPLACE');
CREATE TYPE "AdvertPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAIVED', 'REFUNDED');

ALTER TABLE "User"
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsVersion" TEXT;

ALTER TABLE "Town"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "ProductBoostRequest"
ADD COLUMN "placement" "AdvertPlacement" NOT NULL DEFAULT 'HOMEPAGE',
ADD COLUMN "headline" TEXT,
ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN "feeAmount" DECIMAL(12,2),
ADD COLUMN "paymentStatus" "AdvertPaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "feeReference" TEXT;

CREATE INDEX "ProductBoostRequest_placement_status_startsAt_endsAt_idx"
ON "ProductBoostRequest"("placement", "status", "startsAt", "endsAt");

UPDATE "Town" SET "latitude" = 5.9678765, "longitude" = -1.7873448 WHERE "slug" = 'dunkwa-on-offin';
UPDATE "Town" SET "latitude" = 5.2577781, "longitude" = -1.3388004 WHERE "slug" = 'jukwa';
UPDATE "Town" SET "latitude" = 5.9602024, "longitude" = -1.8951464 WHERE "slug" = 'ayanfuri';
UPDATE "Town" SET "latitude" = 6.1531290, "longitude" = -2.1530130 WHERE "slug" = 'diaso';
UPDATE "Town" SET "latitude" = 6.2115420, "longitude" = -1.6894045 WHERE "slug" = 'obuasi';
UPDATE "Town" SET "latitude" = 5.1080932, "longitude" = -1.2417103 WHERE "slug" = 'cape-coast';
UPDATE "Town" SET "latitude" = 6.6985605, "longitude" = -1.6233086 WHERE "slug" = 'kumasi';
