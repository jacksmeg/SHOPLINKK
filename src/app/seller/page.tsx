import { Boxes, Eye, Megaphone, MessageCircle, PackagePlus, Settings, ShieldCheck, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SellerProductActions } from "@/components/seller/product-actions";
import { VerificationForm } from "@/components/seller/verification-form";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, chats] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id } }),
    prisma.product.findMany({
      where: { sellerId: session.user.id },
      include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
  ]);

  const approved = products.filter((product) => product.listingStatus === "APPROVED").length;
  const drafts = products.filter((product) => product.listingStatus === "DRAFT").length;
  const views = products.reduce((total, product) => total + product.viewCount, 0);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Dashboard"
      description="Manage your store, listings, stock, and buyer messages."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/store", label: "Store management", icon: Settings },
        { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/seller/products/bulk", label: "Bulk upload", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total listings" value={products.length} icon={Boxes} helper="Including pending products" />
        <StatCard label="Approved" value={approved} icon={Store} helper="Visible to buyers" />
        <StatCard label="Drafts" value={drafts} icon={PackagePlus} helper="Not public yet" />
        <StatCard label="Views" value={views} icon={Eye} helper="Across your products" />
        <StatCard label="Buyer chats" value={chats} icon={MessageCircle} helper="Product-linked conversations" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="app-panel p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--brand)]" size={20} />
            <h2 className="text-sm font-black text-[var(--ink)]">Seller trust</h2>
          </div>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{store?.trustScore ?? 50}%</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Verification: {titleCase(store?.verificationStatus ?? "NOT_SUBMITTED")}
          </p>
        </div>
        <div className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Store availability</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{store?.openingHours || "Add opening hours so buyers know when to reach you."}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{store?.address || store?.area || "Add a store address or area."}</p>
        </div>
        <div className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Response rate</h2>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{store?.responseRate ?? 0}%</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Reply quickly to improve buyer confidence.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-sm font-black text-[var(--ink)]">Your product listings</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">New and edited products go through approval before going public.</p>
        </div>
        <ButtonLink href="/seller/products/new">Add product</ButtonLink>
        <ButtonLink href="/seller/products/bulk" variant="secondary">Bulk upload</ButtonLink>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-[var(--ink)]">{product.title}</h3><p className="mt-1 text-xs text-[var(--muted)]">{product.category.name} · {formatCurrency(Number(product.price))} · {product.viewCount} views</p></div><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></div>
            <div className="mt-3 border-t border-[var(--line)] pt-3"><SellerProductActions productId={product.id} productSlug={product.slug} productTitle={product.title} approved={product.listingStatus === "APPROVED"} /></div>
            {product.rejectionReason ? <p className="mt-2 text-xs leading-5 text-red-700">Reason: {product.rejectionReason}</p> : product.approvalNote ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{product.approvalNote}</p> : null}
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-hidden rounded-[8px] border border-[var(--line)] bg-white md:block">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 font-bold text-[var(--ink)]">{product.title}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.category.name}</td>
                  <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</td>
                  <td className="px-4 py-4"><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></td>
                  <td className="px-4 py-4 text-[var(--muted)]">{titleCase(product.stockStatus)}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.viewCount}</td>
                  <td className="px-4 py-4">
                    <SellerProductActions productId={product.id} productSlug={product.slug} productTitle={product.title} approved={product.listingStatus === "APPROVED"} />
                    {product.rejectionReason ? (
                      <p className="mt-2 max-w-sm text-xs leading-5 text-red-700">Reason: {product.rejectionReason}</p>
                    ) : product.approvalNote ? (
                      <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">{product.approvalNote}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!products.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                    No products yet. Add your first listing.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <VerificationForm defaultName={store?.name} />
      </div>
    </DashboardShell>
  );
}
