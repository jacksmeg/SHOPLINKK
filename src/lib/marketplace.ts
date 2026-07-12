import type {
  Category,
  ListingPaymentStatus,
  ListingStatus,
  ListingType,
  Prisma,
  PriceMode,
  ProductCondition,
  StockStatus,
  StoreKind,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { demoCategories, demoProducts, demoStores, townCoordinates, townLocations } from "@/lib/demo-data";

export type PublicCategory = Pick<
  Category,
  "id" | "name" | "slug" | "description" | "icon"
> & { productCount?: number };

export type PublicProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  listingType?: ListingType | string;
  priceMode?: PriceMode | string;
  price: number;
  salePrice?: number | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
  quantity?: number;
  condition: ProductCondition | string;
  location: string;
  area?: string | null;
  pickupNote?: string | null;
  stockStatus: StockStatus | string;
  listingStatus: ListingStatus | string;
  listingPaymentStatus?: ListingPaymentStatus | string;
  negotiable?: boolean;
  allowCalls?: boolean;
  allowWhatsapp?: boolean;
  isFeatured: boolean;
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  viewCount?: number;
  createdAt: Date | string;
  category: PublicCategory;
  store: {
    id: string;
    name: string;
    slug: string;
    kind?: StoreKind | string;
    location: string;
    area?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    momoNumber?: string | null;
    address?: string | null;
    openingHours?: string | null;
    logoUrl?: string | null;
    isVerified?: boolean;
    verificationStatus?: string;
    trustScore?: number;
    ratingAverage?: number;
    ratingCount?: number;
  } | null;
  seller: {
    id: string;
    name: string | null;
    image?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    location?: string | null;
    area?: string | null;
    emailVerified?: Date | string | null;
    phoneVerifiedAt?: Date | string | null;
  };
  images: { url: string; alt?: string | null }[];
};

export type PublicStore = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  location: string;
  area?: string | null;
  address?: string | null;
  openingHours?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isVerified: boolean;
  verificationStatus?: string;
  trustScore?: number;
  ratingAverage?: number;
  ratingCount?: number;
  owner: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  products?: PublicProduct[];
  kind?: StoreKind | string;
  momoNumber?: string | null;
  createdAt?: Date | string;
};

export type PublicTown = {
  id: string;
  name: string;
  slug: string;
  region: string;
  latitude: number;
  longitude: number;
  areas: { id: string; name: string; slug: string }[];
};

export type PublicHomepageAdvert = {
  id: string;
  headline: string;
  endsAt: Date | string;
  images: { url: string; alt?: string | null }[];
  product: PublicProduct;
};

const productInclude = {
  category: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      kind: true,
      location: true,
      area: true,
      phone: true,
      whatsapp: true,
      momoNumber: true,
      address: true,
      openingHours: true,
      logoUrl: true,
      isVerified: true,
      verificationStatus: true,
      trustScore: true,
      ratingAverage: true,
      ratingCount: true,
    },
  },
  seller: {
    select: {
      id: true,
      name: true,
      image: true,
      phone: true,
      whatsapp: true,
      location: true,
      area: true,
      emailVerified: true,
      phoneVerifiedAt: true,
    },
  },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { url: true, alt: true },
  },
};

function normalizeProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>): PublicProduct {
  return {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  };
}

function filterDemoProducts(filters?: {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  location?: string;
  area?: string;
  condition?: string;
  sort?: string;
}) {
  const products = demoProducts.filter((product) => {
    const localProduct = product as typeof product & { area?: string | null };
    const query = filters?.q?.toLowerCase().trim();
    const matchesQuery =
      !query ||
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);
    const matchesCategory =
      !filters?.category || product.category.slug === filters.category;
    const matchesMin = !filters?.min || product.price >= filters.min;
    const matchesMax = !filters?.max || product.price <= filters.max;
    const matchesLocation =
      !filters?.location ||
      product.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesArea =
      !filters?.area ||
      String(localProduct.area ?? "").toLowerCase().includes(filters.area.toLowerCase());
    const matchesCondition =
      !filters?.condition || product.condition === filters.condition;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesMin &&
      matchesMax &&
      matchesLocation &&
      matchesArea &&
      matchesCondition
    );
  }) as PublicProduct[];

  return products.sort((a, b) => {
    switch (filters?.sort) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "popular":
        return Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0);
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "nearest":
        return String(a.location).localeCompare(String(b.location));
      case "featured":
      default:
        return Number(b.isFeatured) - Number(a.isFeatured) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

export async function getCategories(): Promise<PublicCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        _count: {
          select: {
            products: {
              where: {
                listingStatus: "APPROVED",
                stockStatus: { not: "SOLD" },
              },
            },
          },
        },
      },
    });
    return categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    }));
  } catch {
    return demoCategories.map((category) => ({
      ...category,
      productCount: demoProducts.filter((product) => product.category.slug === category.slug).length,
    }));
  }
}

export async function getPublicProducts(filters?: {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  location?: string;
  area?: string;
  condition?: ProductCondition;
  sort?: "featured" | "newest" | "price_low" | "price_high" | "popular" | "nearest";
  take?: number;
  skip?: number;
}): Promise<PublicProduct[]> {
  try {
    const where: Prisma.ProductWhereInput = {
      listingStatus: "APPROVED",
      stockStatus: {
        not: "SOLD",
      },
    };

    if (filters?.q) {
      where.OR = [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    if (filters?.category) {
      where.category = { slug: filters.category };
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters?.area) {
      where.area = { contains: filters.area, mode: "insensitive" };
    }

    if (filters?.condition) {
      where.condition = filters.condition;
    }

    if (filters?.min || filters?.max) {
      where.price = {
        ...(filters.min ? { gte: filters.min } : {}),
        ...(filters.max ? { lte: filters.max } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      filters?.sort === "price_low"
        ? [{ price: "asc" }]
        : filters?.sort === "price_high"
          ? [{ price: "desc" }]
          : filters?.sort === "popular"
            ? [{ viewCount: "desc" }, { createdAt: "desc" }]
            : filters?.sort === "newest"
              ? [{ createdAt: "desc" }]
              : filters?.sort === "nearest"
                ? [{ location: "asc" }, { area: "asc" }, { createdAt: "desc" }]
                : [{ isFeatured: "desc" }, { createdAt: "desc" }];

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      take: filters?.take,
      skip: filters?.skip,
    });

    return products.map(normalizeProduct);
  } catch {
    const start = filters?.skip ?? 0;
    const end = filters?.take ? start + filters.take : undefined;
    return filterDemoProducts(filters).slice(start, end);
  }
}

export async function getFeaturedProducts() {
  const products = await getPublicProducts({ take: 8 });
  return products.filter((product) => product.isFeatured).slice(0, 6);
}

export async function getLatestProducts() {
  return getPublicProducts({ take: 8 });
}

export async function getTrendingProducts() {
  return getPublicProducts({ sort: "popular", take: 12 });
}

export async function getFlashSaleProducts() {
  try {
    const now = new Date();
    const products = await prisma.product.findMany({
      where: {
        listingStatus: "APPROVED",
        stockStatus: { not: "SOLD" },
        salePrice: { not: null },
        saleStartsAt: { lte: now },
        saleEndsAt: { gt: now },
      },
      include: productInclude,
      orderBy: [{ saleEndsAt: "asc" }, { createdAt: "desc" }],
      take: 12,
    });

    return products.map(normalizeProduct).filter((product) => Number(product.salePrice ?? 0) < product.price);
  } catch {
    return [];
  }
}

export async function getHomepageAdverts(): Promise<PublicHomepageAdvert[]> {
  try {
    const now = new Date();
    const adverts = await prisma.productBoostRequest.findMany({
      where: {
        status: "APPROVED",
        placement: "HOMEPAGE",
        paymentStatus: { in: ["CONFIRMED", "WAIVED"] },
        startsAt: { lte: now },
        endsAt: { gt: now },
        product: { listingStatus: "APPROVED", stockStatus: { not: "SOLD" } },
      },
      include: {
        product: { include: productInclude },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, alt: true },
        },
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    });

    return adverts.map((advert) => ({
      id: advert.id,
      headline: advert.headline || advert.product.title,
      endsAt: advert.endsAt!,
      images: advert.images,
      product: normalizeProduct(advert.product),
    }));
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<PublicProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        listingStatus: "APPROVED",
      },
      include: productInclude,
    });

    if (!product) {
      return null;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return normalizeProduct(product);
  } catch {
    return (demoProducts.find((product) => product.slug === slug) as PublicProduct) ?? null;
  }
}

export async function getProductSeoBySlug(slug: string): Promise<PublicProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        listingStatus: "APPROVED",
      },
      include: productInclude,
    });

    return product ? normalizeProduct(product) : null;
  } catch {
    return (demoProducts.find((product) => product.slug === slug) as PublicProduct) ?? null;
  }
}

export async function getRelatedProducts(product: PublicProduct) {
  const products = await getPublicProducts({
    category: product.category.slug,
    take: 5,
  });

  return products.filter((item) => item.id !== product.id).slice(0, 4);
}

export async function getStoreBySlug(slug: string): Promise<PublicStore | null> {
  try {
    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        products: {
          where: { listingStatus: "APPROVED" },
          include: productInclude,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!store) {
      return null;
    }

    return {
      ...store,
      products: store.products.map(normalizeProduct),
    };
  } catch {
    const store = demoStores.find((item) => item.slug === slug);
    if (!store) {
      return null;
    }

    return {
      ...store,
      products: demoProducts.filter((product) => product.store.slug === slug) as PublicProduct[],
    };
  }
}

export async function getPlatformStats() {
  try {
    const [products, sellers, categories, pendingReports] = await Promise.all([
      prisma.product.count({ where: { listingStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.category.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

    return { products, sellers, categories, pendingReports };
  } catch {
    return {
      products: demoProducts.length,
      sellers: demoStores.length,
      categories: demoCategories.length,
      pendingReports: 0,
    };
  }
}

export async function getPublicTowns(): Promise<PublicTown[]> {
  try {
    const towns = await prisma.town.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        region: true,
        latitude: true,
        longitude: true,
        areas: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return towns.map((town) => ({
      ...town,
      latitude: town.latitude!,
      longitude: town.longitude!,
    }));
  } catch {
    return townLocations.map((name, index) => ({
      id: `town-${index}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      region: name === "Kumasi" || name === "Obuasi" ? "Ashanti Region" : "Central Region",
      latitude: townCoordinates[name].latitude,
      longitude: townCoordinates[name].longitude,
      areas: [],
    }));
  }
}
