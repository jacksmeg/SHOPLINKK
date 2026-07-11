import { randomBytes } from "node:crypto";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  ListingStatus,
  PrismaClient,
  ProductCondition,
  StockStatus,
} from "../src/generated/prisma/client";
import { demoCategories, demoProducts, townCoordinates, townLocations } from "../src/lib/demo-data";
import { dunkwaAreas } from "../src/lib/ghana";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/shoplinkk?schema=public";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function seedSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const adminEmail = process.env.SHOPLINKK_ADMIN_EMAIL?.trim() || "admin@shoplinkk.com";
  const adminPassword = process.env.SHOPLINKK_ADMIN_PASSWORD?.trim() || randomBytes(18).toString("base64url");
  const buyerPassword = randomBytes(18).toString("base64url");
  const sellerPassword = randomBytes(18).toString("base64url");
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const buyerPasswordHash = await bcrypt.hash(buyerPassword, 12);
  const sellerPasswordHash = await bcrypt.hash(sellerPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      phoneVerifiedAt: new Date(),
      emailVerified: new Date(),
      phone: "+233240000101",
    },
    create: {
      name: "ShopLinkk Admin",
      email: adminEmail,
      emailVerified: new Date(),
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "+233240000101",
      phoneVerifiedAt: new Date(),
      location: "Dunkwa-on-Offin",
      bio: "Platform administrator for marketplace moderation.",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@shoplinkk.com" },
    update: {
      passwordHash: buyerPasswordHash,
      phone: "+233550000202",
      whatsapp: "+233550000202",
      area: "Town Centre",
    },
    create: {
      name: "Ama Buyer",
      email: "buyer@shoplinkk.com",
      passwordHash: buyerPasswordHash,
      role: "BUYER",
      phone: "+233550000202",
      whatsapp: "+233550000202",
      location: "Dunkwa-on-Offin",
      area: "Town Centre",
      bio: "Looking for safe local deals around town.",
    },
  });

  const sellerOne = await prisma.user.upsert({
    where: { email: "seller@shoplinkk.com" },
    update: {
      passwordHash: sellerPasswordHash,
      phone: "+233244101198",
      whatsapp: "+233244101198",
      area: "Dunkwa Market",
    },
    create: {
      name: "Kojo Mensah",
      email: "seller@shoplinkk.com",
      passwordHash: sellerPasswordHash,
      role: "SELLER",
      phone: "+233244101198",
      whatsapp: "+233244101198",
      location: "Dunkwa-on-Offin",
      area: "Dunkwa Market",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    },
  });

  const sellerTwo = await prisma.user.upsert({
    where: { email: "seller2@shoplinkk.com" },
    update: {
      passwordHash: sellerPasswordHash,
      phone: "+233553208841",
      whatsapp: "+233553208841",
      area: "Atechem",
    },
    create: {
      name: "Nana Ama Boateng",
      email: "seller2@shoplinkk.com",
      passwordHash: sellerPasswordHash,
      role: "SELLER",
      phone: "+233553208841",
      whatsapp: "+233553208841",
      location: "Dunkwa-on-Offin",
      area: "Atechem",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  });

  const categoryBySlug = new Map<string, { id: string }>();
  for (const category of demoCategories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      },
    });
    categoryBySlug.set(category.slug, saved);
  }

  for (const [index, town] of townLocations.entries()) {
    const coordinates = townCoordinates[town];
    const savedTown = await prisma.town.upsert({
      where: { slug: seedSlug(town) },
      update: {
        name: town,
        sortOrder: index,
        isActive: true,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      },
      create: {
        name: town,
        slug: seedSlug(town),
        region: town === "Kumasi" || town === "Obuasi" ? "Ashanti Region" : "Central Region",
        sortOrder: index,
        isActive: true,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      },
    });

    if (town === "Dunkwa-on-Offin") {
      for (const [areaIndex, area] of dunkwaAreas.entries()) {
        await prisma.townArea.upsert({
          where: {
            townId_slug: {
              townId: savedTown.id,
              slug: seedSlug(area),
            },
          },
          update: {
            name: area,
            sortOrder: areaIndex,
            isActive: true,
          },
          create: {
            townId: savedTown.id,
            name: area,
            slug: seedSlug(area),
            sortOrder: areaIndex,
            isActive: true,
          },
        });
      }
    }
  }

  const storeOne = await prisma.store.upsert({
    where: { slug: "offin-digital-hub" },
    update: {
      whatsapp: "+233244101198",
      area: "Dunkwa Market",
      address: "Near Dunkwa main market",
      openingHours: "Mon-Sat, 8:00am-6:30pm",
      responseRate: 92,
      trustScore: 88,
      ratingAverage: 4.7,
      ratingCount: 18,
      isVerified: true,
      verificationStatus: "VERIFIED",
    },
    create: {
      ownerId: sellerOne.id,
      name: "Offin Digital Hub",
      slug: "offin-digital-hub",
      description:
        "Phones, laptop accessories, and reliable device support around Dunkwa market.",
      phone: "+233244101198",
      whatsapp: "+233244101198",
      location: "Dunkwa-on-Offin",
      area: "Dunkwa Market",
      address: "Near Dunkwa main market",
      openingHours: "Mon-Sat, 8:00am-6:30pm",
      logoUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80",
      coverUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      isVerified: true,
      verificationStatus: "VERIFIED",
      responseRate: 92,
      trustScore: 88,
      ratingAverage: 4.7,
      ratingCount: 18,
    },
  });

  const storeTwo = await prisma.store.upsert({
    where: { slug: "nana-ama-home-finds" },
    update: {
      whatsapp: "+233553208841",
      area: "Atechem",
      address: "Atechem road, Dunkwa-on-Offin",
      openingHours: "Mon-Sat, 9:00am-6:00pm",
      responseRate: 81,
      trustScore: 74,
      ratingAverage: 4.4,
      ratingCount: 11,
      verificationStatus: "PENDING",
    },
    create: {
      ownerId: sellerTwo.id,
      name: "Nana Ama Home Finds",
      slug: "nana-ama-home-finds",
      description:
        "Furniture, small appliances, and tidy home pieces available for pickup or delivery discussion.",
      phone: "+233553208841",
      whatsapp: "+233553208841",
      location: "Dunkwa-on-Offin",
      area: "Atechem",
      address: "Atechem road, Dunkwa-on-Offin",
      openingHours: "Mon-Sat, 9:00am-6:00pm",
      logoUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      coverUrl:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
      verificationStatus: "PENDING",
      responseRate: 81,
      trustScore: 74,
      ratingAverage: 4.4,
      ratingCount: 11,
    },
  });

  const sellers = [sellerOne, sellerTwo];
  const stores = [storeOne, storeTwo];
  const seededProducts = [];

  for (const [index, product] of demoProducts.entries()) {
    const seller = sellers[index % sellers.length];
    const store = stores[index % stores.length];
    const category = categoryBySlug.get(product.category.slug);

    if (!category) continue;

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        condition: product.condition as ProductCondition,
        location: product.location,
        area: product.location === "Dunkwa-on-Offin" ? "Town Centre" : null,
        stockStatus: product.stockStatus as StockStatus,
        listingStatus: product.listingStatus as ListingStatus,
        isFeatured: product.isFeatured,
        negotiable: true,
        allowCalls: true,
        allowWhatsapp: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        pickupNote: "Chat with the seller to agree on safe inspection or pickup.",
        seoTitle: product.title,
        seoDescription: product.description.slice(0, 155),
        categoryId: category.id,
        sellerId: seller.id,
        storeId: store.id,
        images: {
          deleteMany: {},
          create: product.images.map((image, imageIndex) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: imageIndex,
          })),
        },
      },
      create: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        condition: product.condition as ProductCondition,
        location: product.location,
        area: product.location === "Dunkwa-on-Offin" ? "Town Centre" : null,
        stockStatus: product.stockStatus as StockStatus,
        listingStatus: product.listingStatus as ListingStatus,
        isFeatured: product.isFeatured,
        negotiable: true,
        allowCalls: true,
        allowWhatsapp: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        pickupNote: "Chat with the seller to agree on safe inspection or pickup.",
        seoTitle: product.title,
        seoDescription: product.description.slice(0, 155),
        categoryId: category.id,
        sellerId: seller.id,
        storeId: store.id,
        images: {
          create: product.images.map((image, imageIndex) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: imageIndex,
          })),
        },
      },
    });
    seededProducts.push(saved);
  }

  if (seededProducts[0]) {
    const conversation = await prisma.conversation.upsert({
      where: {
        productId_buyerId_sellerId: {
          productId: seededProducts[0].id,
          buyerId: buyer.id,
          sellerId: seededProducts[0].sellerId,
        },
      },
      update: {},
      create: {
        productId: seededProducts[0].id,
        buyerId: buyer.id,
        sellerId: seededProducts[0].sellerId,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buyer.id,
        body: "Hello, is this still available for inspection around Dunkwa?",
      },
    });
  }

  await prisma.favoriteFolder.upsert({
    where: { userId_name: { userId: buyer.id, name: "Shortlist" } },
    update: {},
    create: { userId: buyer.id, name: "Shortlist" },
  });

  if (seededProducts[0]) {
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: buyer.id, productId: seededProducts[0].id } },
      update: {},
      create: { userId: buyer.id, productId: seededProducts[0].id },
    });

    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId: buyer.id, productId: seededProducts[0].id } },
      update: { viewedAt: new Date() },
      create: { userId: buyer.id, productId: seededProducts[0].id },
    });
  }

  await prisma.savedSearch.deleteMany({ where: { userId: buyer.id, name: "Phones in Dunkwa" } });
  await prisma.savedSearch.create({
    data: {
      userId: buyer.id,
      name: "Phones in Dunkwa",
      query: "iphone",
      category: "phones-tablets",
      location: "Dunkwa-on-Offin",
      alertsEnabled: true,
    },
  });

  await prisma.sellerVerification.deleteMany({
    where: {
      OR: [
        { sellerId: sellerOne.id, businessName: "Offin Digital Hub" },
        { sellerId: sellerTwo.id, businessName: "Nana Ama Home Finds" },
      ],
    },
  });

  await prisma.sellerVerification.create({
    data: {
      sellerId: sellerOne.id,
      storeId: storeOne.id,
      status: "VERIFIED",
      businessName: "Offin Digital Hub",
      documentUrl: "https://example.com/demo-verification.pdf",
      notes: "Seeded verified seller for demo moderation.",
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.sellerVerification.create({
    data: {
      sellerId: sellerTwo.id,
      storeId: storeTwo.id,
      status: "PENDING",
      businessName: "Nana Ama Home Finds",
      notes: "Pending verification demo request.",
    },
  });

  if (seededProducts[0]) {
    await prisma.review.upsert({
      where: {
        authorId_sellerId_productId: {
          authorId: buyer.id,
          sellerId: seededProducts[0].sellerId,
          productId: seededProducts[0].id,
        },
      },
      update: { rating: 5, comment: "Quick response and clear inspection arrangement." },
      create: {
        authorId: buyer.id,
        sellerId: seededProducts[0].sellerId,
        storeId: storeOne.id,
        productId: seededProducts[0].id,
        rating: 5,
        comment: "Quick response and clear inspection arrangement.",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: sellerOne.id,
        type: "MESSAGE",
        title: "New buyer message",
        body: "Ama Buyer asked about inspecting a product.",
        href: "/chat",
      },
      {
        userId: sellerOne.id,
        type: "LISTING",
        title: "Listing approved",
        body: "Your product is visible in the marketplace.",
        href: "/seller",
      },
      {
        userId: admin.id,
        type: "REPORT",
        title: "Report needs review",
        body: "A seeded product report is waiting in moderation.",
        href: "/admin/reports",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.report.deleteMany({ where: { reason: "Sample moderation report" } });
  await prisma.report.create({
    data: {
      reporterId: buyer.id,
      productId: seededProducts[1]?.id,
      reportedUserId: seededProducts[1]?.sellerId,
      reason: "Sample moderation report",
      details: "This seeded report shows how admins can review community flags.",
    },
  });

  if (seededProducts[1]) {
    await prisma.adminNote.deleteMany({
      where: {
        authorId: admin.id,
        productId: seededProducts[1].id,
        body: "Check seller response quality before featuring this listing.",
      },
    });
    await prisma.adminNote.create({
      data: {
        authorId: admin.id,
        productId: seededProducts[1].id,
        body: "Check seller response quality before featuring this listing.",
      },
    });
  }

  await prisma.adminAuditLog.deleteMany({
    where: {
      actorId: admin.id,
      metadata: { path: ["source"], equals: "seed" },
    },
  });
  await prisma.adminAuditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: "SELLER_VERIFIED",
        targetType: "User",
        targetId: sellerOne.id,
        metadata: { source: "seed" },
      },
      ...(seededProducts[0]
        ? [
            {
              actorId: admin.id,
              action: "PRODUCT_APPROVED" as const,
              targetType: "Product",
              targetId: seededProducts[0].id,
              metadata: { source: "seed" },
            },
          ]
        : []),
    ],
  });

  console.log("ShopLinkk seed complete");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Seller: seller@shoplinkk.com / ${sellerPassword}`);
  console.log(`Buyer: buyer@shoplinkk.com / ${buyerPassword}`);
  console.log(`Seeded by ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
