import { BarChart3, Download, FileText, PackageCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerReportsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [products, orders, reviews] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.foodOrder.findMany({ where: { store: { ownerId: session.user.id } }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.review.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const revenue = orders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <DashboardShell eyebrow="Seller" title="Reports" description="Sales, inventory, orders, customer, and revenue reports for your store." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Sales report" value={formatCurrency(revenue)} icon={BarChart3} helper="Recent food orders" tone="sea" />
        <StatCard label="Inventory report" value={products.length} icon={PackageCheck} helper="Recent products" tone="pink" />
        <StatCard label="Customer report" value={reviews.length} icon={FileText} helper="Recent reviews" tone="yellow" />
      </div>
      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        {[
          { title: "Sales report", body: `${orders.length} recent orders, ${formatCurrency(revenue)} order value.`, href: "/seller/orders" },
          { title: "Inventory report", body: `${products.length} recent products. Low stock items are highlighted in inventory.`, href: "/seller/inventory" },
          { title: "Customer report", body: `${reviews.length} recent reviews. Followers and reviews help your store score.`, href: "/seller/followers" },
        ].map((item) => (
          <div key={item.title} className="app-panel p-4">
            <Download size={18} className="text-[var(--brand)]" />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{item.title}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.body}</p>
            <ButtonLink href={item.href} variant="secondary" className="mt-4">Open</ButtonLink>
          </div>
        ))}
      </section>
      <div className="mt-5 app-panel p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Latest report activity</h2>
        <div className="mt-4 grid gap-2">
          {orders.slice(0, 5).map((order) => <p key={order.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted)]">Order {order.id.slice(0, 8)} - {formatCurrency(Number(order.totalAmount))} - {compactDate(order.createdAt)}</p>)}
          {!orders.length ? <p className="text-xs text-[var(--muted)]">Report activity will appear after orders and product updates.</p> : null}
        </div>
      </div>
    </DashboardShell>
  );
}
