import { AlertTriangle, CheckCircle2, MessageCircle, RotateCcw, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerReturnsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, cancelledMarketplace, cancelledFood, reports, deliveryReports] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { kind: true, name: true } }),
    prisma.marketplaceOrder.findMany({
      where: { sellerId: session.user.id, status: "CANCELLED" },
      include: { buyer: { select: { name: true, phone: true } }, items: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.foodOrder.findMany({
      where: { store: { ownerId: session.user.id }, status: "CANCELLED" },
      include: { buyer: { select: { name: true, phone: true } }, items: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.report.findMany({
      where: { OR: [{ reportedUserId: session.user.id }, { product: { sellerId: session.user.id } }] },
      include: { product: { select: { title: true } }, reporter: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.deliveryReport.findMany({
      where: { delivery: { sellerId: session.user.id } },
      include: { reporter: { select: { name: true, phone: true } }, rider: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const cancelledValue = cancelledMarketplace.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    + cancelledFood.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const openReports = reports.filter((report) => report.status === "OPEN").length + deliveryReports.filter((report) => report.status === "OPEN").length;

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Returns and complaints"
      description="Review cancelled orders, buyer complaints, delivery issues, and actions needed to protect your store reputation."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cancelled orders" value={cancelledMarketplace.length + cancelledFood.length} icon={RotateCcw} helper="Product, service, and food" tone="sea" />
        <StatCard label="Cancelled value" value={formatCurrency(cancelledValue)} icon={AlertTriangle} helper="Needs reconciliation" tone="pink" />
        <StatCard label="Open reports" value={openReports} icon={MessageCircle} helper="Buyer or delivery issues" tone="yellow" />
        <StatCard label="Resolved" value={reports.filter((report) => report.status === "RESOLVED").length + deliveryReports.filter((report) => report.status === "RESOLVED").length} icon={CheckCircle2} helper="Closed cases" tone="blue" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Cancelled order queue</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Use this page to follow up with buyers before a complaint becomes serious.</p>
            </div>
            <ButtonLink href="/seller/orders" variant="secondary">Open orders</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3">
            {cancelledMarketplace.map((order) => (
              <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">{order.items.map((item) => item.title).join(", ")}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.buyerName || order.buyer.name || "Buyer"} - {order.buyerPhone || order.buyer.phone || "No phone"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(order.updatedAt)}</p>
                  </div>
                  <Badge tone="red">Cancelled</Badge>
                </div>
                <p className="mt-3 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
              </article>
            ))}
            {cancelledFood.map((order) => (
              <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">{order.items.map((item) => item.name).join(", ")}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.buyerName || order.buyer.name || "Buyer"} - {order.buyerPhone || order.buyer.phone || "No phone"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(order.updatedAt)}</p>
                  </div>
                  <Badge tone="red">Cancelled food</Badge>
                </div>
                <p className="mt-3 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
              </article>
            ))}
            {!cancelledMarketplace.length && !cancelledFood.length ? <p className="text-xs text-[var(--muted)]">No cancelled orders yet.</p> : null}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Report handling</h2>
          <div className="mt-4 grid gap-3">
            {reports.map((report) => (
              <article key={report.id} className="rounded-[8px] bg-red-600 p-3 text-xs text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{report.product?.title || "Seller report"}</p>
                    <p className="mt-1 text-white/85">{report.reason}</p>
                  </div>
                  <span>{titleCase(report.status)}</span>
                </div>
              </article>
            ))}
            {deliveryReports.map((report) => (
              <article key={report.id} className="rounded-[8px] bg-cyan-700 p-3 text-xs text-white">
                <Truck size={15} />
                <p className="mt-2 font-black">{titleCase(report.reason)}</p>
                <p className="mt-1 text-white/85">Rider: {report.rider?.user.name || "Not assigned"} - {titleCase(report.status)}</p>
              </article>
            ))}
            {!reports.length && !deliveryReports.length ? <p className="text-xs text-[var(--muted)]">No complaints or delivery reports.</p> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
