import { WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sumFees(deliveries: { deliveryFee: unknown }[]) {
  return deliveries.reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0);
}

export default async function RiderWalletPage() {
  const session = await requireRole(["RIDER", "ADMIN"]);
  const profile = await prisma.riderProfile.findUnique({
    where: { userId: session.user.id },
    include: { deliveries: { where: { status: "DELIVERED" }, orderBy: { deliveredAt: "desc" } } },
  });

  const deliveries = profile?.deliveries ?? [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = [
    { label: "Today", value: sumFees(deliveries.filter((item) => item.deliveredAt && item.deliveredAt >= startOfDay)), color: "bg-cyan-600" },
    { label: "This week", value: sumFees(deliveries.filter((item) => item.deliveredAt && item.deliveredAt >= startOfWeek)), color: "bg-pink-600" },
    { label: "This month", value: sumFees(deliveries.filter((item) => item.deliveredAt && item.deliveredAt >= startOfMonth)), color: "bg-amber-400 text-slate-950" },
    { label: "Total earnings", value: sumFees(deliveries), color: "bg-blue-700" },
  ];

  return (
    <DashboardShell eyebrow="Rider" title="Wallet" description="View delivery earnings. Payouts can be connected later when ShopLinkk activates rider payouts." links={riderLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className={`${row.color} rounded-[10px] p-4 text-white`}>
            <p className="text-xs font-bold opacity-90">{row.label}</p>
            <p className="mt-2 text-xl font-black">{formatCurrency(row.value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 app-panel p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Payout details</h2>
        {profile ? (
          <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
            <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">MoMo: <strong>{profile.momoNumber || "Not added"}</strong></p>
            <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Bank: <strong>{profile.bankName || "Not added"}</strong></p>
          </div>
        ) : (
          <EmptyState title="No rider wallet yet" description="Complete your rider application first." icon={WalletCards} />
        )}
      </div>
    </DashboardShell>
  );
}
