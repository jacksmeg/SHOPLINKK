import { BriefcaseBusiness, ChefHat, MessageCircle, PackagePlus, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/forms/product-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { getPlatformConfig } from "@/lib/platform-settings";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requireRole(["SELLER", "ADMIN"]);
  const [categories, platform, listingPackages] = await Promise.all([
    getCategories(),
    getPlatformConfig(),
    prisma.billingPackage.findMany({
      where: { type: "PRODUCT_LISTING", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      select: { id: true, name: true, description: true, price: true, currency: true },
    }),
  ]);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Add service"
      description="Create a service listing with booking details, coverage area, portfolio images, and contact options."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/seller/services/new", label: "Add service", icon: BriefcaseBusiness },
        { href: "/seller/food/menu", label: "Add food", icon: ChefHat },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <ProductForm
        categories={categories}
        listingPackages={listingPackages.map((item) => ({ ...item, price: Number(item.price) }))}
        maxImages={platform.maxProductImages}
        mode="SERVICE"
      />
    </DashboardShell>
  );
}
