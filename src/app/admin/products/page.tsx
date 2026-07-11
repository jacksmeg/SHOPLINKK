import Link from "next/link";
import type { ListingStatus, Prisma } from "@/generated/prisma/client";
import { ProductModerationActions } from "@/components/admin/admin-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";
import { adminLinks } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
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
  }

  if (category) {
    where.category = { slug: category };
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({
    where,
    include: {
      seller: { select: { name: true, email: true } },
      category: true,
    },
    orderBy: [{ listingStatus: "asc" }, { createdAt: "desc" }],
  });

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Products"
      description="Approve, reject, or remove listings before they reach buyers."
      links={adminLinks}
    >
      <form className="mb-4 grid gap-2 rounded-[8px] border border-[var(--line)] bg-white p-3 md:grid-cols-[1fr_160px_200px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search listing, seller, email..."
          className="form-control px-3 text-xs"
        />
        <select
          name="status"
          defaultValue={status}
          className="form-control bg-white px-3 text-xs"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
          <option value="REMOVED">Removed</option>
        </select>
        <select
          name="category"
          defaultValue={category}
          className="form-control bg-white px-3 text-xs"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>
        <button className="min-h-10 rounded-[7px] bg-[var(--brand)] px-4 text-xs font-semibold text-white" type="submit">
          Filter
        </button>
      </form>
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-black text-[var(--ink)]">{product.title}</Link><p className="mt-1 truncate text-xs text-[var(--muted)]">{product.seller.name ?? product.seller.email}</p></div><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]"><span>{product.category.name}</span><span>{formatCurrency(Number(product.price))}</span><span>{product.viewCount} views</span></div>
            <div className="mt-3 border-t border-[var(--line)] pt-3"><ProductModerationActions productId={product.id} featured={product.isFeatured} /></div>
          </article>
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
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4">
                    <Link href={`/products/${product.slug}`} className="font-black text-[var(--ink)] hover:text-[var(--brand)]">
                      {product.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.seller.name ?? product.seller.email}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.category.name}</td>
                  <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</td>
                  <td className="px-4 py-4"><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : product.listingStatus === "DRAFT" ? "neutral" : "gold"}>{titleCase(product.listingStatus)}</Badge></td>
                  <td className="px-4 py-4 text-xs leading-5 text-[var(--muted)]">
                    <p>{product.area ?? product.location}</p>
                    <p>{product.viewCount} views · {product.isFeatured ? "Featured" : "Not featured"}</p>
                    {product.approvalNote ? <p className="text-cyan-800">{product.approvalNote}</p> : null}
                    {product.rejectionReason ? <p className="text-red-700">{product.rejectionReason}</p> : null}
                  </td>
                  <td className="px-4 py-4"><ProductModerationActions productId={product.id} featured={product.isFeatured} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
