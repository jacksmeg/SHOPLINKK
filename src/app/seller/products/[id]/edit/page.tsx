import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/forms/product-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { prisma } from "@/lib/db";
import { getPlatformConfig } from "@/lib/platform-settings";
import { requireGeneralSellerStore } from "@/lib/seller-access";
import { sellerLinks } from "@/lib/seller-navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["SELLER", "ADMIN"]);
  if (session.user.role !== "ADMIN") {
    await requireGeneralSellerStore(session.user.id);
  }

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
      title={product.listingType === "SERVICE" ? "Edit service" : "Edit product"}
      description="Changes by sellers return the listing to pending review."
      links={sellerLinks}
    >
      <ProductForm
        categories={categories}
        product={{
          ...product,
          price: Number(product.price),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          saleStartsAt: product.saleStartsAt?.toISOString() ?? null,
          saleEndsAt: product.saleEndsAt?.toISOString() ?? null,
        }}
        maxImages={platform.maxProductImages}
        mode={product.listingType === "SERVICE" ? "SERVICE" : "PRODUCT"}
      />
    </DashboardShell>
  );
}
