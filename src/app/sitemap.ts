import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const staticRoutes = [
    "",
    "/marketplace",
    "/categories",
    "/about",
    "/contact",
    "/safety",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const products = await prisma.product.findMany({
    where: { listingStatus: "APPROVED" },
    select: { slug: true, updatedAt: true },
    take: 1000,
  }).catch(() => []);

  const stores = await prisma.store.findMany({
    select: { slug: true, updatedAt: true },
    take: 500,
  }).catch(() => []);

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt,
    })),
    ...stores.map((store) => ({
      url: `${base}/stores/${store.slug}`,
      lastModified: store.updatedAt,
    })),
  ];
}

