import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Store, Tag } from "lucide-react";
import { ProductModerationActions } from "@/components/admin/admin-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { adminLinks } from "@/lib/admin-navigation";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      seller: { select: { id: true, name: true, email: true, phone: true, whatsapp: true, isBlocked: true } },
      store: { select: { id: true, name: true, slug: true, phone: true, whatsapp: true, location: true, area: true, isVerified: true } },
      reports: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Product review"
      description="Inspect the full listing, seller details, images, and moderation signals before approving."
      links={adminLinks}
    >
      <div className="mb-4">
        <ButtonLink href="/admin/products" variant="secondary">
          <ArrowLeft size={16} />
          Back to products
        </ButtonLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="app-panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : product.listingStatus === "DRAFT" ? "neutral" : "gold"}>{titleCase(product.listingStatus)}</Badge>
              <Badge tone={product.stockStatus === "AVAILABLE" ? "blue" : "neutral"}>{titleCase(product.stockStatus)}</Badge>
              <Badge tone="neutral">{titleCase(product.condition)}</Badge>
              {product.isFeatured ? <Badge tone="blue">Featured</Badge> : null}
            </div>
            <h1 className="mt-3 text-xl font-black text-[var(--ink)]">{product.title}</h1>
            <p className="mt-2 text-lg font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</p>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3">
              <span className="inline-flex items-center gap-2"><Tag size={15} /> {product.category.name}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={15} /> {product.area ?? product.location}</span>
              <span>{product.viewCount} views</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(product.images.length ? product.images : [{ id: "empty", url: "/window.svg", alt: product.title }]).map((image) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)]">
                <Image src={image.url} alt={image.alt ?? product.title} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>

          <section className="mt-5 app-panel p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{product.description}</p>
            {product.videoUrl ? (
              <ButtonLink href={product.videoUrl} target="_blank" rel="noreferrer" variant="secondary" className="mt-4">
                Open product video
              </ButtonLink>
            ) : null}
          </section>
        </section>

        <aside className="grid gap-4 self-start">
          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Moderation action</h2>
            <div className="mt-4">
              <ProductModerationActions productId={product.id} featured={product.isFeatured} />
            </div>
            {product.approvalNote ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Approval note: {product.approvalNote}</p> : null}
            {product.rejectionReason ? <p className="mt-3 text-xs leading-5 text-red-700">Rejection reason: {product.rejectionReason}</p> : null}
          </section>

          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Seller</h2>
            <p className="mt-2 text-xs font-bold text-[var(--ink)]">{product.seller.name ?? product.seller.email ?? "Seller"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{product.seller.email}</p>
            {product.seller.phone ? <p className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--muted)]"><Phone size={14} /> {product.seller.phone}</p> : null}
            {product.seller.isBlocked ? <p className="mt-3 rounded-[8px] bg-red-50 p-3 text-xs font-semibold text-red-700">This seller is currently blocked.</p> : null}
          </section>

          {product.store ? (
            <section className="app-panel p-4">
              <h2 className="text-sm font-black text-[var(--ink)]">Store</h2>
              <Link href={`/stores/${product.store.slug}`} className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--brand-dark)]">
                <Store size={15} />
                {product.store.name}
              </Link>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{product.store.area ?? product.store.location}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{product.store.isVerified ? "Verified seller store" : "Not verified yet"}</p>
            </section>
          ) : null}

          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Reports</h2>
            {product.reports.length ? (
              <div className="mt-3 grid gap-2">
                {product.reports.map((report) => (
                  <p key={report.id} className="rounded-[8px] bg-red-50 p-3 text-xs leading-5 text-red-700">
                    {report.reason}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">No product reports.</p>
            )}
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
