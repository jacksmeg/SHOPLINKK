import Image from "next/image";
import { notFound } from "next/navigation";
import { Megaphone, MessageCircle, PackagePlus, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdvertRequestForm } from "@/components/seller/advert-request-form";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdvertiseProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Request advert"
      description="Ask admin to run this product in the homepage advert trail or featured marketplace placement."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/store", label: "Store management", icon: Store },
        { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <article className="app-panel self-start overflow-hidden p-0">
          <div className="relative aspect-[4/3] bg-[var(--surface-muted)]">
            <Image
              src={product.images[0]?.url ?? "/window.svg"}
              alt={product.images[0]?.alt ?? product.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={product.listingStatus === "APPROVED" ? "green" : "gold"}>{titleCase(product.listingStatus)}</Badge>
              <Badge tone={product.stockStatus === "AVAILABLE" ? "blue" : "neutral"}>{titleCase(product.stockStatus)}</Badge>
            </div>
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{product.title}</h2>
            <p className="mt-1 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{product.category.name} · {product.area ?? product.location}</p>
          </div>
        </article>
        {product.listingStatus === "APPROVED" && product.stockStatus === "AVAILABLE" ? (
          <AdvertRequestForm productId={product.id} productTitle={product.title} />
        ) : (
          <div className="app-panel p-5">
            <div className="grid size-11 place-items-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand)]">
              <Megaphone size={20} />
            </div>
            <h2 className="mt-4 text-sm font-black text-[var(--ink)]">Advert not available yet</h2>
            <p className="mt-2 max-w-xl text-xs leading-5 text-[var(--muted)]">
              Only approved and available products can be requested for adverts. Wait for approval or mark the product available before requesting promotion.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
