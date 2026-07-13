import { AlertTriangle, Boxes, History, PackageCheck, Warehouse } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SellerProductActions } from "@/components/seller/product-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerInventoryPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [products, priceHistory] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: session.user.id },
      include: { category: true },
      orderBy: [{ quantity: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.productPriceHistory.findMany({
      where: { product: { sellerId: session.user.id } },
      include: { product: { select: { title: true } } },
      orderBy: { changedAt: "desc" },
      take: 8,
    }),
  ]);

  const lowStock = products.filter((product) => product.stockStatus !== "SOLD" && product.quantity <= 3);
  const outOfStock = products.filter((product) => product.stockStatus === "OUT_OF_STOCK" || product.quantity <= 0);
  const active = products.filter((product) => product.listingStatus === "APPROVED" && product.stockStatus === "AVAILABLE");

  return (
    <DashboardShell eyebrow="Seller" title="Inventory management" description="Track product stock, low stock alerts, listing status, and inventory changes." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={products.length} icon={Boxes} helper="All listing states" tone="sea" />
        <StatCard label="Active stock" value={active.length} icon={PackageCheck} helper="Approved and available" tone="pink" />
        <StatCard label="Low stock" value={lowStock.length} icon={AlertTriangle} helper="3 units or fewer" tone="yellow" />
        <StatCard label="Out of stock" value={outOfStock.length} icon={Warehouse} helper="Needs restocking" tone="red" />
      </div>

      <section className="mt-5 app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--ink)]">Stock counter</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Edit a product to update quantity, SKU, discount, delivery options, and status.</p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/seller/products/new">Add product</ButtonLink>
            <ButtonLink href="/seller/products/bulk" variant="secondary">Bulk upload</ButtonLink>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="data-table w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 font-black text-[var(--ink)]">{product.title}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.category.name}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.sku || "Not set"}</td>
                  <td className="px-4 py-4">
                    <Badge tone={product.quantity <= 0 ? "red" : product.quantity <= 3 ? "gold" : "green"}>{product.quantity} units</Badge>
                  </td>
                  <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.salePrice ?? product.price))}</td>
                  <td className="px-4 py-4"><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></td>
                  <td className="px-4 py-4"><SellerProductActions productId={product.id} productSlug={product.slug} productTitle={product.title} approved={product.listingStatus === "APPROVED"} /></td>
                </tr>
              ))}
              {!products.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">No inventory yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 app-panel p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[var(--brand)]" />
          <h2 className="text-sm font-black text-[var(--ink)]">Inventory history</h2>
        </div>
        <div className="mt-4 grid gap-2">
          {priceHistory.map((item) => (
            <div key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs">
              <p className="font-black text-[var(--ink)]">{item.product.title}</p>
              <p className="mt-1 text-[var(--muted)]">Price changed from {formatCurrency(Number(item.oldPrice))} to {formatCurrency(Number(item.newPrice))} on {compactDate(item.changedAt)}</p>
            </div>
          ))}
          {!priceHistory.length ? <p className="text-xs text-[var(--muted)]">Price and inventory updates will appear here as your store grows.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
