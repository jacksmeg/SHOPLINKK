import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowLeft, Boxes, ChevronRight, FolderOpen, Search } from "lucide-react";
import type { ListingStatus, Prisma } from "@/generated/prisma/client";
import { ProductModerationActions } from "@/components/admin/admin-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { adminLinks } from "@/lib/admin-navigation";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function categoryTone(index: number, active: boolean) {
  if (active) return "bg-[var(--brand)] text-white";
  return [
    "bg-cyan-600 text-white",
    "bg-pink-600 text-white",
    "bg-yellow-400 text-slate-950",
    "bg-red-600 text-white",
    "bg-purple-700 text-white",
    "bg-blue-700 text-white",
  ][index % 6];
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const query = value(params, "q") ?? "";
  const status = value(params, "status") ?? "";
  const category = value(params, "category") ?? "";
  const where: Prisma.ProductWhereInput = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { seller: { email: { contains: query, mode: "insensitive" } } },
      { seller: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.listingStatus = status as ListingStatus;
  } else {
    where.listingStatus = { not: "REMOVED" };
  }

  if (category) {
    where.category = { slug: category };
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: status
            ? { where: { listingStatus: status as ListingStatus } }
            : { where: { listingStatus: { not: "REMOVED" } } },
        },
      },
    },
  });

  const products = await prisma.product.findMany({
    where,
    include: {
      seller: { select: { name: true, email: true } },
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: [{ category: { name: "asc" } }, { listingStatus: "asc" }, { createdAt: "desc" }],
  });

  const selectedCategory = category ? categories.find((item) => item.slug === category) : null;
  const groupedProducts = categories
    .map((item) => ({
      category: item,
      products: products.filter((product) => product.categoryId === item.id),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Products"
      description="Browse listings by category, inspect full details, approve, reject, feature, or permanently remove products."
      links={adminLinks}
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((item, index) => {
          const active = item.slug === category;
          return (
            <Link
              key={item.id}
              href={`/admin/products?category=${item.slug}${status ? `&status=${status}` : ""}`}
              className={`uiverse-depth-card rounded-[8px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid size-10 place-items-center rounded-[8px] ${categoryTone(index, active)}`}>
                  <FolderOpen size={17} />
                </span>
                <ChevronRight size={16} />
              </div>
              <p className="mt-3 text-sm font-black">{item.name}</p>
              <p className={`mt-1 text-xs ${active ? "text-white/80" : "text-[var(--muted)]"}`}>{item._count.products} products</p>
            </Link>
          );
        })}
      </div>

      {selectedCategory ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-white p-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Selected category</p>
            <h2 className="text-base font-black text-[var(--ink)]">{selectedCategory.name}</h2>
          </div>
          <Link href="/admin/products" className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-3 text-xs font-black text-[var(--brand-dark)] transition hover:border-[var(--brand)]">
            <ArrowLeft size={14} />
            Back to all categories
          </Link>
        </div>
      ) : null}

      <form className="mb-4 grid gap-2 rounded-[8px] border border-[var(--line)] bg-white p-3 md:grid-cols-[1fr_160px_200px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search listing, seller, email..."
          className="form-control px-3 text-xs"
        />
        <select name="status" defaultValue={status} className="form-control bg-white px-3 text-xs">
          <option value="">Active statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
          <option value="REMOVED">Removed</option>
        </select>
        <select name="category" defaultValue={category} className="form-control bg-white px-3 text-xs">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] bg-[var(--brand)] px-4 text-xs font-semibold text-white" type="submit">
          <Search size={14} />
          Filter
        </button>
      </form>

      <div className="grid gap-3 md:hidden">
        {groupedProducts.map((group) => (
          <section key={group.category.id} className="grid gap-2">
            <div className="flex items-center gap-2 rounded-[8px] bg-[var(--brand-dark)] px-3 py-2 text-white">
              <Boxes size={15} />
              <h2 className="text-xs font-black">{group.category.name}</h2>
              <span className="ml-auto text-[0.68rem] font-bold text-white/75">{group.products.length}</span>
            </div>
            {group.products.map((product) => (
              <article key={product.id} className="app-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[8px] bg-[var(--surface-muted)]">
                      <Image src={product.images[0]?.url ?? "/window.svg"} alt={product.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/products/${product.id}`} className="line-clamp-2 text-sm font-black text-[var(--ink)]">{product.title}</Link>
                      <p className="mt-1 truncate text-xs text-[var(--muted)]">{product.seller.name ?? product.seller.email}</p>
                    </div>
                  </div>
                  <Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                  <span>{formatCurrency(Number(product.price))}</span>
                  <span>{product.viewCount} views</span>
                  <span>{product.area ?? product.location}</span>
                </div>
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <div className="mb-2">
                    <Link href={`/admin/products/${product.id}`} className="text-xs font-black text-[var(--brand-dark)]">View before approval</Link>
                  </div>
                  <ProductModerationActions productId={product.id} featured={product.isFeatured} />
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[8px] border border-[var(--line)] bg-white md:block">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[1080px] text-left text-xs">
            <thead className="bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signals</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {groupedProducts.map((group) => (
                <Fragment key={group.category.id}>
                  <tr className="bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark)]">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={15} />
                        <span className="font-black">{group.category.name}</span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.68rem] font-bold">{group.products.length} products</span>
                      </div>
                    </td>
                  </tr>
                  {group.products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-[var(--surface-muted)]">
                            <Image src={product.images[0]?.url ?? "/window.svg"} alt={product.title} fill className="object-cover" unoptimized />
                          </div>
                          <div>
                            <Link href={`/admin/products/${product.id}`} className="font-black text-[var(--ink)] hover:text-[var(--brand)]">
                              {product.title}
                            </Link>
                            <p className="mt-1 text-[0.7rem] font-bold text-[var(--brand-dark)]">View before approval</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[var(--muted)]">{product.seller.name ?? product.seller.email}</td>
                      <td className="px-4 py-4 text-[var(--muted)]">{product.category.name}</td>
                      <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</td>
                      <td className="px-4 py-4"><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : product.listingStatus === "DRAFT" ? "neutral" : "gold"}>{titleCase(product.listingStatus)}</Badge></td>
                      <td className="px-4 py-4 text-xs leading-5 text-[var(--muted)]">
                        <p>{product.area ?? product.location}</p>
                        <p>{product.viewCount} views - {product.isFeatured ? "Featured" : "Not featured"}</p>
                        {product.approvalNote ? <p className="text-cyan-800">{product.approvalNote}</p> : null}
                        {product.rejectionReason ? <p className="text-red-700">{product.rejectionReason}</p> : null}
                      </td>
                      <td className="px-4 py-4"><ProductModerationActions productId={product.id} featured={product.isFeatured} /></td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {!groupedProducts.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-[var(--muted)]">
                    No products found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
