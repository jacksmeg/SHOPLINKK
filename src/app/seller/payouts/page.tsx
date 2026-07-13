import { Banknote, CreditCard, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerPayoutsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, orders] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { momoNumber: true, phone: true } }),
    prisma.foodOrder.findMany({ where: { store: { ownerId: session.user.id }, status: { not: "CANCELLED" } } }),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <DashboardShell eyebrow="Seller" title="Payouts and wallet" description="Future wallet, pending balance, available balance, withdrawal history, MoMo, and bank details." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total earnings" value={formatCurrency(revenue)} icon={Wallet} helper="Food orders recorded" tone="sea" />
        <StatCard label="Pending balance" value={formatCurrency(0)} icon={CreditCard} helper="Future online payments" tone="yellow" />
        <StatCard label="Available balance" value={formatCurrency(0)} icon={Banknote} helper="Future payouts" tone="pink" />
        <StatCard label="MoMo number" value={store?.momoNumber || store?.phone || "Not set"} icon={CreditCard} helper="Store payment contact" tone="blue" />
      </div>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Withdrawal history</h2>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">When online payments and seller payouts are turned on, withdrawals to Mobile Money and bank transfer will be recorded here.</p>
      </section>
    </DashboardShell>
  );
}
