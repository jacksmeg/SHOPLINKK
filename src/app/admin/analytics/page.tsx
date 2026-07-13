import { BarChart3, ChefHat, PackageCheck, Store, Truck, Users } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireRole(["ADMIN"]);
  const [users, stores, products, foodOrders, deliveries, topCategories] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.foodOrder.count(),
    prisma.delivery.count(),
    prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { products: { _count: "desc" } }, take: 5 }),
  ]);
  return (
    <AdminModulePage
      title="Analytics"
      description="Platform growth, visitors, sales, top categories, stores, restaurants, riders, and user activity."
      stats={[
        { label: "Users", value: users, icon: Users, helper: "Registered accounts", tone: "sea" },
        { label: "Stores", value: stores, icon: Store, helper: "Seller stores", tone: "pink" },
        { label: "Products", value: products, icon: PackageCheck, helper: "Listings", tone: "yellow" },
        { label: "Food orders", value: foodOrders, icon: ChefHat, helper: "Restaurant orders", tone: "purple" },
        { label: "Deliveries", value: deliveries, icon: Truck, helper: "Rider records", tone: "blue" },
        { label: "Top category", value: topCategories[0]?.name ?? "None", icon: BarChart3, helper: `${topCategories[0]?._count.products ?? 0} listings`, tone: "sea" },
      ]}
      actions={topCategories.map((category) => ({ title: category.name, body: `${category._count.products} products listed in this category.`, href: `/marketplace?category=${category.slug}` }))}
    />
  );
}
