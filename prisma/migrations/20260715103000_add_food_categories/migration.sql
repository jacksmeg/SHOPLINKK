CREATE TABLE "FoodCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodCategory_slug_key" ON "FoodCategory"("slug");
CREATE INDEX "FoodCategory_isActive_sortOrder_idx" ON "FoodCategory"("isActive", "sortOrder");

ALTER TABLE "FoodMenuItem" ADD COLUMN "foodCategoryId" TEXT;
CREATE INDEX "FoodMenuItem_foodCategoryId_idx" ON "FoodMenuItem"("foodCategoryId");
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_foodCategoryId_fkey" FOREIGN KEY ("foodCategoryId") REFERENCES "FoodCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "FoodCategory" ("id", "name", "slug", "description", "icon", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('foodcat_rice_dishes', 'Rice dishes', 'rice-dishes', 'Jollof rice, fried rice, plain rice, and rice bowls.', 'rice', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_waakye', 'Waakye meals', 'waakye-meals', 'Waakye with gari, spaghetti, egg, meat, fish, and shito.', 'waakye', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_banku', 'Banku and tilapia', 'banku-and-tilapia', 'Banku, tilapia, okro stew, pepper, and fish meals.', 'banku', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_fufu', 'Fufu and soups', 'fufu-and-soups', 'Fufu with light soup, palm nut soup, groundnut soup, and meats.', 'fufu', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_kenkey', 'Kenkey and fish', 'kenkey-and-fish', 'Ga kenkey, Fante kenkey, fried fish, sardines, and pepper.', 'kenkey', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_ampesi', 'Ampesi and kontomire', 'ampesi-and-kontomire', 'Boiled yam, plantain, cocoyam, kontomire stew, and eggs.', 'ampesi', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_yam_kelewele', 'Fried yam and kelewele', 'fried-yam-and-kelewele', 'Fried yam, kelewele, turkey tail, sausage, gizzard, and pepper.', 'yam', 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_beans_gari', 'Beans and gari', 'beans-and-gari', 'Red red, beans stew, gari, fried plantain, and egg.', 'beans', 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_noodles', 'Noodles and pasta', 'noodles-and-pasta', 'Indomie, spaghetti, macaroni, stir fry, and quick meals.', 'noodles', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_grills_kebabs', 'Grills and kebabs', 'grills-and-kebabs', 'Khebab, grilled chicken, fish, sausage, gizzard, and barbecue.', 'grill', 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_pastries_snacks', 'Pastries and snacks', 'pastries-and-snacks', 'Meat pie, chips, spring rolls, doughnuts, bofrot, and pies.', 'snacks', 110, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_breakfast', 'Breakfast meals', 'breakfast-meals', 'Porridge, oats, bread, tea, koko, koose, and morning meals.', 'breakfast', 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_soups_stews', 'Soups and stews', 'soups-and-stews', 'Local soups, stews, sauces, and ready-made accompaniments.', 'soup', 130, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_drinks', 'Drinks and smoothies', 'drinks-and-smoothies', 'Sobolo, asaana, juices, smoothies, water, and soft drinks.', 'drinks', 140, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_desserts', 'Desserts and sweets', 'desserts-and-sweets', 'Ice cream, cakes, yoghurt, fruit cups, and sweet treats.', 'dessert', 150, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foodcat_street_food', 'Local street food', 'local-street-food', 'Popular street meals and quick local bites around town.', 'street-food', 160, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

