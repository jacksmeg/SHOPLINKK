import { BarChart3, Download, FileText, PackageCheck, Route, Star, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerReportsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, foodOrders, marketplaceOrders, reviews, reports, deliveryReports, followers] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { id: true, kind: true, name: true } }),
    prisma.product.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.foodOrder.findMany({ where: { store: { ownerId: session.user.id } }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.marketplaceOrder.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.review.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.report.findMany({
      where: { OR: [{ reportedUserId: session.user.id }, { product: { sellerId: session.user.id } }] },
      include: { product: { select: { title: true } }, reporter: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.deliveryReport.findMany({
      where: { delivery: { sellerId: session.user.id } },
      include: { reporter: { select: { name: true, email: true } }, rider: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.storeFollower.count({ where: { store: { ownerId: session.user.id } } }),
  ]);

  const orderRevenue = [
    ...foodOrders.map((order) => ({ amount: Number(order.totalAmount), status: order.status })),
    ...marketplaceOrders.map((order) => ({ amount: Number(order.totalAmount), status: order.status })),
  ];
  const revenue = orderRevenue.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + order.amount, 0);
  const lowStock = products.filter((product) => product.listingType === "PRODUCT" && product.quantity <= 3 && product.stockStatus === "AVAILABLE").length;
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const activeReports = reports.filter((report) => report.status === "OPEN").length + deliveryReports.filter((report) => report.status === "OPEN").length;

  const reportCards = [
    { title: "Sales report", body: `${foodOrders.length + marketplaceOrders.length} recent orders with ${formatCurrency(revenue)} recorded value.`, href: "/seller/orders", icon: BarChart3 },
    { title: "Inventory report", body: `${products.length} products/services tracked. ${lowStock} low stock alert${lowStock === 1 ? "" : "s"}.`, href: "/seller/inventory", icon: PackageCheck },
    { title: "Customer report", body: `${followers} follower${followers === 1 ? "" : "s"} and ${reviews.length} review${reviews.length === 1 ? "" : "s"}.`, href: "/seller/followers", icon: Users },
    { title: "Delivery report", body: `${deliveryReports.length} rider or delivery issue report${deliveryReports.length === 1 ? "" : "s"} recorded.`, href: "/seller/delivery", icon: Route },
  ];

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Reports"
      description="Review sales, stock, customers, delivery, complaints, ratings, and store performance."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Sales value" value={formatCurrency(revenue)} icon={BarChart3} helper="Recent order value" tone="sea" />
        <StatCard label="Inventory" value={products.length} icon={PackageCheck} helper={`${lowStock} low stock`} tone="pink" />
        <StatCard label="Average rating" value={averageRating ? averageRating.toFixed(1) : "0.0"} icon={Star} helper={`${reviews.length} reviews`} tone="yellow" />
        <StatCard label="Followers" value={followers} icon={Users} helper="Store audience" tone="blue" />
        <StatCard label="Open issues" value={activeReports} icon={FileText} helper="Needs attention" tone="purple" />
      </div>

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        {reportCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="app-panel p-4">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--brand-dark)] text-white">
                <Icon size={18} />
              </span>
              <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.body}</p>
              <ButtonLink href={item.href} variant="secondary" className="mt-4">Open</ButtonLink>
            </div>
          );
        })}
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Latest report activity</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Orders, reviews, reports, and delivery complaints are grouped here.</p>
            </div>
            <button className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--muted)]" type="button">
              <Download size={14} />
              Export soon
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {[...foodOrders.slice(0, 4), ...marketplaceOrders.slice(0, 4)].slice(0, 8).map((order) => (
              <p key={`${"totalAmount" in order ? "order" : "unknown"}-${order.id}`} className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted)]">
                Order #{order.id.slice(0, 8)} - {formatCurrency(Number(order.totalAmount))} - {titleCase(order.status)} - {compactDate(order.createdAt)}
              </p>
            ))}
            {!foodOrders.length && !marketplaceOrders.length ? <p className="text-xs text-[var(--muted)]">Report activity will appear after orders and product updates.</p> : null}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Complaints and risk signals</h2>
          <div className="mt-4 grid gap-2">
            {reports.slice(0, 6).map((report) => (
              <div key={report.id} className="rounded-[8px] bg-red-600 p-3 text-xs text-white">
                <p className="font-black">{report.product?.title || "Seller report"} - {titleCase(report.status)}</p>
                <p className="mt-1 text-white/85">{report.reason}</p>
              </div>
            ))}
            {deliveryReports.slice(0, 6).map((report) => (
              <div key={report.id} className="rounded-[8px] bg-cyan-700 p-3 text-xs text-white">
                <p className="font-black">Delivery report - {titleCase(report.status)}</p>
                <p className="mt-1 text-white/85">{titleCase(report.reason)} {report.rider?.user.name ? `with ${report.rider.user.name}` : ""}</p>
              </div>
            ))}
            {!reports.length && !deliveryReports.length ? <p className="text-xs text-[var(--muted)]">No open complaint reports.</p> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
