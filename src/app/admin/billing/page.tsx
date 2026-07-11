import { CreditCard, ReceiptText, WalletCards } from "lucide-react";
import { BillingManager } from "@/components/admin/billing/billing-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { getBillingConfig } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requireRole(["ADMIN"]);
  const [config, packages, pendingPayments, successfulPayments, revenue] = await Promise.all([
    getBillingConfig(),
    prisma.billingPackage.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { price: "asc" }],
      include: { _count: { select: { payments: true } } },
    }),
    prisma.paymentTransaction.count({ where: { status: "PENDING" } }),
    prisma.paymentTransaction.count({ where: { status: "SUCCESS" } }),
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
  ]);

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Payments and billing"
      description="Set seller upload fees, advert packages, active gateway, and automatic approval rules."
      links={adminLinks}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-950">
        <span>Active gateway: <strong>{config.activeProvider}</strong>. Add or test live keys from API connections.</span>
        <Badge tone="blue">{config.autoApprovePaidListings ? "Listings auto-approve" : "Listings manual"}</Badge>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Paid revenue" value={formatCurrency(Number(revenue._sum.amount ?? 0))} icon={WalletCards} helper="Confirmed payments" tone="sea" />
        <StatCard label="Successful payments" value={successfulPayments} icon={ReceiptText} helper="Completed gateway checks" tone="pink" />
        <StatCard label="Pending payments" value={pendingPayments} icon={CreditCard} helper="Awaiting gateway confirmation" tone="yellow" />
      </div>
      <BillingManager
        config={config}
        packages={packages.map((item) => ({ ...item, price: Number(item.price) }))}
      />
    </DashboardShell>
  );
}
