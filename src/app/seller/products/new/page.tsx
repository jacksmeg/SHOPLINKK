import { MessageCircle, PackagePlus, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/forms/product-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireRole(["SELLER", "ADMIN"]);
  const [categories, platform] = await Promise.all([getCategories(), getPlatformConfig()]);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Add product"
      description="Create a listing with images, price, stock, and approval status."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <ProductForm categories={categories} maxImages={platform.maxProductImages} />
    </DashboardShell>
  );
}
