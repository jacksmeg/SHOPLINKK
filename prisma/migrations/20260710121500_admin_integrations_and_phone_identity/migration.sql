ALTER TYPE "AuditAction" ADD VALUE 'INTEGRATION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PLATFORM_SETTINGS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOWN_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOWN_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'BOOST_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'BOOST_REJECTED';

CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_OAUTH', 'RESEND', 'CLOUDINARY', 'TINIFY', 'TWILIO', 'PUSHER', 'MONITORING');
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONFIGURED', 'CONNECTED', 'ERROR');

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "IntegrationSetting" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "publicConfig" JSONB,
    "encryptedSecrets" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestMessage" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationSetting_provider_key" ON "IntegrationSetting"("provider");
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

ALTER TABLE "IntegrationSetting" ADD CONSTRAINT "IntegrationSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformSetting" ADD CONSTRAINT "PlatformSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
