ALTER TABLE "Product"
ADD COLUMN "salePrice" DECIMAL(12, 2),
ADD COLUMN "saleStartsAt" TIMESTAMP(3),
ADD COLUMN "saleEndsAt" TIMESTAMP(3);

CREATE INDEX "Product_saleStartsAt_saleEndsAt_idx" ON "Product"("saleStartsAt", "saleEndsAt");
