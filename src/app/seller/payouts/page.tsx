import { Banknote, CreditCard, FileText, Landmark, ReceiptText, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerPayoutsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, foodOrders, marketplaceOrders, payments] = await Promise.all([
    prisma.store.findUnique({
      where: { ownerId: session.user.id },
      select: { kind: true, name: true, logoUrl: true, momoNumber: true, phone: true, whatsapp: true, address: true, area: true, location: true },
    }),
    prisma.foodOrder.findMany({ where: { store: { ownerId: session.user.id } }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.marketplaceOrder.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.paymentTransaction.findMany({
      where: { userId: session.user.id },
      include: { package: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const allOrders = [
    ...foodOrders.map((order) => ({ id: order.id, kind: "Food", status: order.status, payment: order.directPaymentStatus, amount: Number(order.totalAmount), createdAt: order.createdAt })),
    ...marketplaceOrders.map((order) => ({ id: order.id, kind: "Marketplace", status: order.status, payment: order.directPaymentStatus, amount: Number(order.totalAmount), createdAt: order.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const grossRevenue = allOrders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + order.amount, 0);
  const confirmedRevenue = allOrders.filter((order) => order.payment === "CONFIRMED").reduce((sum, order) => sum + order.amount, 0);
  const pendingRevenue = allOrders.filter((order) => ["AWAITING_PAYMENT", "SUBMITTED"].includes(order.payment)).reduce((sum, order) => sum + order.amount, 0);
  const cancelledRevenue = allOrders.filter((order) => order.status === "CANCELLED").reduce((sum, order) => sum + order.amount, 0);
  const platformSpend = payments.filter((payment) => payment.status === "SUCCESS").reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Finance and revenue"
      description="Track order revenue, pending direct payments, seller fees, MoMo destination, receipts, and future wallet payouts."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Gross order value" value={formatCurrency(grossRevenue)} icon={Wallet} helper="Non-cancelled orders" tone="sea" />
        <StatCard label="Confirmed money" value={formatCurrency(confirmedRevenue)} icon={Banknote} helper="Seller marked received" tone="pink" />
        <StatCard label="Pending payment" value={formatCurrency(pendingRevenue)} icon={CreditCard} helper="Awaiting proof or review" tone="yellow" />
        <StatCard label="Cancelled value" value={formatCurrency(cancelledRevenue)} icon={FileText} helper="Cancelled orders" tone="blue" />
        <StatCard label="Platform fees" value={formatCurrency(platformSpend)} icon={Landmark} helper="Ads/listing packages" tone="purple" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Recent money movement</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Direct order payments and platform billing are kept separate so you can reconcile your MoMo account.</p>
            </div>
            <ButtonLink href="/seller/orders" variant="secondary">Open orders</ButtonLink>
          </div>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-[var(--line)]">
            <table className="data-table w-full min-w-[760px] text-left text-xs">
              <thead className="bg-[var(--brand-dark)] text-white">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-white">
                {allOrders.slice(0, 14).map((order) => (
                  <tr key={`${order.kind}-${order.id}`}>
                    <td className="px-4 py-3 font-black text-[var(--ink)]">{order.kind} order #{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{titleCase(order.status)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{titleCase(order.payment)}</td>
                    <td className="px-4 py-3 font-black text-[var(--brand-dark)]">{formatCurrency(order.amount)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{compactDate(order.createdAt)}</td>
                  </tr>
                ))}
                {!allOrders.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center font-bold text-[var(--muted)]">No order revenue yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="grid gap-4 self-start">
          <section className="app-panel p-4 sm:p-5">
            <ReceiptText size={20} className="text-[var(--brand)]" />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">Receipt and invoice identity</h2>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
              <p><strong className="text-[var(--ink)]">Store:</strong> {store?.name || "Not set"}</p>
              <p><strong className="text-[var(--ink)]">Phone:</strong> {store?.phone || store?.whatsapp || "Not set"}</p>
              <p><strong className="text-[var(--ink)]">Address:</strong> {store?.address || store?.area || store?.location || "Not set"}</p>
              <p><strong className="text-[var(--ink)]">MoMo:</strong> {store?.momoNumber || store?.phone || "Not set"}</p>
            </div>
            <ButtonLink href="/seller/store/edit" variant="secondary" className="mt-4">Edit store finance details</ButtonLink>
          </section>

          <section className="app-panel p-4 sm:p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Platform billing</h2>
            <div className="mt-3 grid gap-2">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs">
                  <p className="font-black text-[var(--ink)]">{payment.package?.name || titleCase(payment.purpose)}</p>
                  <p className="mt-1 text-[var(--muted)]">{titleCase(payment.provider)} - {titleCase(payment.status)} - {formatCurrency(Number(payment.amount))}</p>
                </div>
              ))}
              {!payments.length ? <p className="text-xs text-[var(--muted)]">Advert and listing package payments will appear here.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
