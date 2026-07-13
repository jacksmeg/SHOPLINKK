import { CreditCard, History, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerWalletPage() {
  const session = await requireUser();
  const payments = await prisma.paymentTransaction.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <DashboardShell eyebrow="Buyer" title="Wallet" description="Future wallet balance, transaction history, refunds, Mobile Money, and cards." links={buyerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Wallet balance" value={formatCurrency(0)} icon={Wallet} helper="Future payments" tone="sea" />
        <StatCard label="Transactions" value={payments.length} icon={History} helper="Billing activity" tone="pink" />
        <StatCard label="Mobile Money" value="Ready" icon={CreditCard} helper="Future payment method" tone="yellow" />
      </div>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Transaction history</h2>
        <div className="mt-4 grid gap-2">
          {payments.map((payment) => (
            <p key={payment.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted)]">{titleCase(payment.purpose)} - {formatCurrency(Number(payment.amount))} - {titleCase(payment.status)} - {compactDate(payment.createdAt)}</p>
          ))}
          {!payments.length ? <p className="text-xs text-[var(--muted)]">Online payments are prepared but not required for normal buyer-seller contact yet.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
