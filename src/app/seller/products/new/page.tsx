import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/forms/product-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { getPlatformConfig } from "@/lib/platform-settings";
import { prisma } from "@/lib/db";
import { requireGeneralSellerStore } from "@/lib/seller-access";
import { sellerLinks } from "@/lib/seller-navigation";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  if (session.user.role !== "ADMIN") {
    await requireGeneralSellerStore(session.user.id);
  }

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
      title="Add product"
      description="Create a physical product listing with images, price, quantity, stock, and approval status."
      links={sellerLinks}
    >
      <ProductForm
        categories={categories}
        listingPackages={listingPackages.map((item) => ({ ...item, price: Number(item.price) }))}
        maxImages={platform.maxProductImages}
        mode="PRODUCT"
      />
    </DashboardShell>
  );
}
