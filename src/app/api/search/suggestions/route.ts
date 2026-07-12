import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ products: [], categories: [], stores: [] });

  const [products, foodItems, categories, stores] = await Promise.all([
    prisma.product.findMany({
      where: {
        listingStatus: "APPROVED",
        stockStatus: { not: "SOLD" },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        priceMode: true,
        listingType: true,
        area: true,
        location: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.foodMenuItem.findMany({
      where: {
        status: "APPROVED",
        isAvailable: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { store: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        basePrice: true,
        category: true,
        imageUrl: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        store: { select: { slug: true, name: true, area: true, location: true } },
      },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: { where: { listingStatus: "APPROVED", stockStatus: { not: "SOLD" } } },
          },
        },
      },
    }),
    prisma.store.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, name: true, slug: true, location: true, logoUrl: true, isVerified: true },
    }),
  ]);

  return NextResponse.json({
    products: [
      ...products.map((product) => ({
        id: product.id,
        title: product.title,
        slug: product.slug,
        href: `/products/${product.slug}`,
        image: product.images[0]?.url,
        meta: `${product.listingType === "SERVICE" ? "Service" : product.priceMode === "CONTACT" ? "Contact for price" : formatCurrency(Number(product.price))} · ${product.area ?? product.location}`,
      })),
      ...foodItems.map((item) => ({
        id: item.id,
        title: `${item.name} · ${item.store.name}`,
        slug: item.store.slug,
        href: `/stores/${item.store.slug}`,
        image: item.images[0]?.url ?? item.imageUrl,
        meta: `Food · ${item.category || "Menu"} · ${formatCurrency(Number(item.basePrice))} · ${item.store.area ?? item.store.location}`,
      })),
    ].slice(0, 8),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/marketplace?category=${category.slug}`,
      count: category._count.products,
    })),
    stores: stores.map((store) => ({
      id: store.id,
      name: store.name,
      href: `/stores/${store.slug}`,
      image: store.logoUrl,
      meta: `${store.location}${store.isVerified ? " · Verified" : ""}`,
    })),
  });
}
