import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type PublicFoodItem = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  basePrice: number;
  prepMinutes?: number | null;
  deliveryMinutes?: number | null;
  isSpicy: boolean;
  isVegetarian: boolean;
  imageUrl?: string | null;
  images: { id: string; url: string; alt?: string | null }[];
  options: { id: string; name: string; price: number }[];
  store: {
    id: string;
    name: string;
    slug: string;
    area?: string | null;
    location: string;
    momoNumber?: string | null;
    phone?: string | null;
    isVerified: boolean;
    ratingAverage?: number | null;
    ownerId: string;
  };
};

const foodInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  options: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      area: true,
      location: true,
      momoNumber: true,
      phone: true,
      isVerified: true,
      ratingAverage: true,
      ownerId: true,
    },
  },
};

function normalizeFoodItem(item: Prisma.FoodMenuItemGetPayload<{ include: typeof foodInclude }>): PublicFoodItem {
  return {
    ...item,
    basePrice: Number(item.basePrice),
    options: item.options.map((option) => ({ ...option, price: Number(option.price) })),
  };
}

export async function getPublicFoodItems(filters?: {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  area?: string;
  location?: string;
  take?: number;
  skip?: number;
}) {
  const storeWhere: Prisma.StoreWhereInput = { kind: "FOOD" };
  const where: Prisma.FoodMenuItemWhereInput = {
    status: "APPROVED",
    isAvailable: true,
    store: storeWhere,
  };

  if (filters?.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { category: { contains: filters.q, mode: "insensitive" } },
      { store: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  if (filters?.category) where.category = { contains: filters.category, mode: "insensitive" };
  if (filters?.min || filters?.max) {
    where.basePrice = {
      ...(filters.min ? { gte: filters.min } : {}),
      ...(filters.max ? { lte: filters.max } : {}),
    };
  }
  if (filters?.area) storeWhere.area = { contains: filters.area, mode: "insensitive" };
  if (filters?.location) storeWhere.location = { contains: filters.location, mode: "insensitive" };

  const items = await prisma.foodMenuItem.findMany({
    where,
    include: foodInclude,
    orderBy: [{ createdAt: "desc" }],
    take: filters?.take,
    skip: filters?.skip,
  });

  return items.map(normalizeFoodItem);
}

export async function getPublicFoodItem(id: string) {
  const item = await prisma.foodMenuItem.findFirst({
    where: { id, status: "APPROVED", isAvailable: true, store: { kind: "FOOD" } },
    include: foodInclude,
  });

  return item ? normalizeFoodItem(item) : null;
}
