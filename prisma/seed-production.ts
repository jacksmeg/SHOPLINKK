import { randomBytes } from "node:crypto";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { demoCategories, townCoordinates, townLocations } from "../src/lib/demo-data";
import { ghanaianFoodCategorySeeds } from "../src/lib/food-categories";
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
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { passwordHash: true },
  });
  const configuredPassword = process.env.SHOPLINKK_ADMIN_PASSWORD?.trim();
  const generatedPassword = !configuredPassword && !existingAdmin?.passwordHash ? randomBytes(18).toString("base64url") : "";
  const adminPassword = configuredPassword || generatedPassword;
  const adminPasswordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : null;
  const shouldSetAdminPassword = Boolean(adminPasswordHash && !existingAdmin?.passwordHash);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "ShopLinkk Admin",
      role: "ADMIN",
      ...(shouldSetAdminPassword ? { passwordHash: adminPasswordHash } : {}),
      emailVerified: new Date(),
      phoneVerifiedAt: new Date(),
      location: "Dunkwa-on-Offin",
    },
    create: {
      name: "ShopLinkk Admin",
      email: adminEmail,
      emailVerified: new Date(),
      passwordHash: adminPasswordHash ?? await bcrypt.hash(randomBytes(18).toString("base64url"), 12),
      role: "ADMIN",
      phone: "+233240000101",
      phoneVerifiedAt: new Date(),
      location: "Dunkwa-on-Offin",
      bio: "Platform administrator for marketplace moderation.",
    },
  });

  for (const category of demoCategories) {
    await prisma.category.upsert({
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
  }

  for (const category of ghanaianFoodCategorySeeds) {
    await prisma.foodCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
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

  console.log("ShopLinkk production seed complete");
  console.log(`Admin: ${admin.email}`);
  if (generatedPassword) {
    console.log(`Generated admin password: ${adminPassword}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
