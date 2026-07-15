import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const [counts, categories, foodCategories, towns, stores, products, foodItems, billingPackages] = await Promise.all([
    Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.foodMenuItem.count(),
      prisma.foodOrder.count(),
      prisma.delivery.count(),
      prisma.productBoostRequest.count(),
    ]),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.foodCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.town.findMany({ include: { areas: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.store.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        kind: true,
        location: true,
        area: true,
        isVerified: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.product.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        listingType: true,
        listingStatus: true,
        stockStatus: true,
        categoryId: true,
        sellerId: true,
        storeId: true,
        price: true,
        quantity: true,
        location: true,
        area: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.foodMenuItem.findMany({
      select: {
        id: true,
        storeId: true,
        foodCategoryId: true,
        name: true,
        category: true,
        status: true,
        basePrice: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.billingPackage.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
  ]);

  const [users, storeCount, productCount, foodMenuItems, foodOrders, deliveries, advertRequests] = counts;
  const snapshot = {
    generatedAt: new Date().toISOString(),
    app: "ShopLinkk",
    domain: "https://www.shoplinkk.com",
    counts: {
      users,
      stores: storeCount,
      products: productCount,
      foodMenuItems,
      foodOrders,
      deliveries,
      advertRequests,
    },
    categories,
    foodCategories,
    towns,
    stores,
    products,
    foodItems,
    billingPackages,
  };

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="shoplinkk-snapshot-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
