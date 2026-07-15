import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const staticRoutes = [
    "",
    "/marketplace",
    "/sell-on-shoplinkk",
    "/categories",
    "/safety",
    "/community-rules",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/license-agreement",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/marketplace" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : path === "/marketplace" ? 0.95 : 0.75,
  }));

  const [products, stores, categories, foodCategories, foodItems] = await Promise.all([
    prisma.product.findMany({
      where: { listingStatus: "APPROVED", stockStatus: { not: "SOLD" } },
      select: { slug: true, updatedAt: true },
      take: 1500,
    }).catch(() => []),
    prisma.store.findMany({
      select: { slug: true, updatedAt: true },
      take: 800,
    }).catch(() => []),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
      take: 200,
    }).catch(() => []),
    prisma.foodCategory.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 200,
    }).catch(() => []),
    prisma.foodMenuItem.findMany({
      where: { status: "APPROVED", isAvailable: true },
      select: { id: true, updatedAt: true },
      take: 1000,
    }).catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...categories.map((category) => ({
      url: `${base}/marketplace?category=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.82,
    })),
    ...foodCategories.map((category) => ({
      url: `${base}/marketplace?type=food&category=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.82,
    })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...stores.map((store) => ({
      url: `${base}/stores/${store.slug}`,
      lastModified: store.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...foodItems.map((item) => ({
      url: `${base}/food/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.86,
    })),
  ];
}
