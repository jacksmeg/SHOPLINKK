import type { Prisma } from "@/generated/prisma/client";
import { defaultLogoUrl } from "@/lib/brand-assets";
import { prisma } from "@/lib/db";

export type PlatformConfig = {
  brandName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  defaultTown: string;
  listingApproval: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  maintenanceMode: boolean;
  safetyBanner: string;
  listingExpiryDays: number;
  maxProductImages: number;
};

export const defaultPlatformConfig: PlatformConfig = {
  brandName: "ShopLinkk",
  logoUrl: defaultLogoUrl,
  supportEmail: "hello@shoplinkk.com",
  supportPhone: "+233240000000",
  defaultTown: "Dunkwa-on-Offin",
  listingApproval: true,
  allowRegistration: true,
  requireEmailVerification: false,
  requirePhoneVerification: false,
  maintenanceMode: false,
  safetyBanner: "Do not pay before you inspect the item and confirm the seller.",
  listingExpiryDays: 45,
  maxProductImages: 8,
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const setting = await prisma.platformSetting.findUnique({ where: { key: "marketplace" } }).catch(() => null);
  if (!setting?.value || Array.isArray(setting.value) || typeof setting.value !== "object") return defaultPlatformConfig;
  const config = { ...defaultPlatformConfig, ...(setting.value as Partial<PlatformConfig>) };
  const usesRemovedBundledLogo = config.logoUrl.startsWith("/brand/shoplinkk-") && config.logoUrl !== defaultLogoUrl;
  return {
    ...config,
    logoUrl: !config.logoUrl || usesRemovedBundledLogo ? defaultLogoUrl : config.logoUrl,
  };
}

export async function savePlatformConfig(value: PlatformConfig, updatedById: string) {
  return prisma.platformSetting.upsert({
    where: { key: "marketplace" },
    update: { value: value as unknown as Prisma.InputJsonValue, updatedById },
    create: { key: "marketplace", value: value as unknown as Prisma.InputJsonValue, updatedById },
  });
}
