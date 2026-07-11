import { notFound } from "next/navigation";
import { MessageCircle, PackagePlus, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/forms/product-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { prisma } from "@/lib/db";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const { id } = await params;
  const [categories, product, platform] = await Promise.all([
    getCategories(),
    prisma.product.findFirst({
      where: {
        id,
        ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getPlatformConfig(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Edit product"
      description="Changes by sellers return the listing to pending review."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <ProductForm
        categories={categories}
        product={{
          ...product,
          price: Number(product.price),
        }}
        maxImages={platform.maxProductImages}
      />
    </DashboardShell>
  );
}
