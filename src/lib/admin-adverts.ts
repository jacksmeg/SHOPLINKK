import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AdminImageAdvert } from "@/lib/admin-advert-types";

const adminAdvertKey = "admin-image-adverts";

function isAdvertRecord(value: unknown): value is AdminImageAdvert {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AdminImageAdvert>;
  return Boolean(record.id && record.imageUrl && record.startsAt && record.endsAt);
}

export function normalizeAdminImageAdverts(value: unknown): AdminImageAdvert[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isAdvertRecord).map((record) => ({
    ...record,
    headline: record.headline || "ShopLinkk advert",
    href: record.href || "",
    isActive: record.isActive !== false,
  }));
}

export async function getAdminImageAdverts() {
  const setting = await prisma.platformSetting.findUnique({ where: { key: adminAdvertKey } }).catch(() => null);
  return normalizeAdminImageAdverts(setting?.value).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveAdminImageAdverts(records: AdminImageAdvert[], updatedById: string) {
  return prisma.platformSetting.upsert({
    where: { key: adminAdvertKey },
    update: { value: records as unknown as Prisma.InputJsonValue, updatedById },
    create: { key: adminAdvertKey, value: records as unknown as Prisma.InputJsonValue, updatedById },
  });
}

export function getActiveAdminImageAdverts(records: AdminImageAdvert[], now = new Date()) {
  const timestamp = now.getTime();
  return records
    .filter((advert) => {
      const startsAt = new Date(advert.startsAt).getTime();
      const endsAt = new Date(advert.endsAt).getTime();
      return advert.isActive && startsAt <= timestamp && endsAt > timestamp;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
