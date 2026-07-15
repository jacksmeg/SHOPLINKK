export const ghanaianFoodCategorySeeds = [
  { name: "Rice dishes", slug: "rice-dishes", description: "Jollof rice, fried rice, plain rice, and rice bowls.", icon: "rice", sortOrder: 10 },
  { name: "Waakye meals", slug: "waakye-meals", description: "Waakye with gari, spaghetti, egg, meat, fish, and shito.", icon: "waakye", sortOrder: 20 },
  { name: "Banku and tilapia", slug: "banku-and-tilapia", description: "Banku, tilapia, okro stew, pepper, and fish meals.", icon: "banku", sortOrder: 30 },
  { name: "Fufu and soups", slug: "fufu-and-soups", description: "Fufu with light soup, palm nut soup, groundnut soup, and meats.", icon: "fufu", sortOrder: 40 },
  { name: "Kenkey and fish", slug: "kenkey-and-fish", description: "Ga kenkey, Fante kenkey, fried fish, sardines, and pepper.", icon: "kenkey", sortOrder: 50 },
  { name: "Ampesi and kontomire", slug: "ampesi-and-kontomire", description: "Boiled yam, plantain, cocoyam, kontomire stew, and eggs.", icon: "ampesi", sortOrder: 60 },
  { name: "Fried yam and kelewele", slug: "fried-yam-and-kelewele", description: "Fried yam, kelewele, turkey tail, sausage, gizzard, and pepper.", icon: "yam", sortOrder: 70 },
  { name: "Beans and gari", slug: "beans-and-gari", description: "Red red, beans stew, gari, fried plantain, and egg.", icon: "beans", sortOrder: 80 },
  { name: "Noodles and pasta", slug: "noodles-and-pasta", description: "Indomie, spaghetti, macaroni, stir fry, and quick meals.", icon: "noodles", sortOrder: 90 },
  { name: "Grills and kebabs", slug: "grills-and-kebabs", description: "Khebab, grilled chicken, fish, sausage, gizzard, and barbecue.", icon: "grill", sortOrder: 100 },
  { name: "Pastries and snacks", slug: "pastries-and-snacks", description: "Meat pie, chips, spring rolls, doughnuts, bofrot, and pies.", icon: "snacks", sortOrder: 110 },
  { name: "Breakfast meals", slug: "breakfast-meals", description: "Porridge, oats, bread, tea, koko, koose, and morning meals.", icon: "breakfast", sortOrder: 120 },
  { name: "Soups and stews", slug: "soups-and-stews", description: "Local soups, stews, sauces, and ready-made accompaniments.", icon: "soup", sortOrder: 130 },
  { name: "Drinks and smoothies", slug: "drinks-and-smoothies", description: "Sobolo, asaana, juices, smoothies, water, and soft drinks.", icon: "drinks", sortOrder: 140 },
  { name: "Desserts and sweets", slug: "desserts-and-sweets", description: "Ice cream, cakes, yoghurt, fruit cups, and sweet treats.", icon: "dessert", sortOrder: 150 },
  { name: "Local street food", slug: "local-street-food", description: "Popular street meals and quick local bites around town.", icon: "street-food", sortOrder: 160 },
] as const;

export type PublicFoodCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
};

export function slugifyFoodCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getFoodCategories(options: { activeOnly?: boolean; includeCounts?: boolean } = {}) {
  const activeOnly = options.activeOnly ?? true;

  try {
    const { prisma } = await import("@/lib/db");
    const categories = await prisma.foodCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        imageUrl: true,
        sortOrder: true,
        isActive: true,
        _count: {
          select: {
            items: { where: { status: "APPROVED", isAvailable: true } },
          },
        },
      },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      itemCount: _count.items,
    }));
  } catch {
    return ghanaianFoodCategorySeeds.map((category) => ({
      id: `seed-${category.slug}`,
      ...category,
      imageUrl: null,
      isActive: true,
      itemCount: 0,
    }));
  }
}

export async function seedFoodCategories() {
  const { prisma } = await import("@/lib/db");
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
}
