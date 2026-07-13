import { Shield, UserCog, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { sellerLinks } from "@/lib/seller-navigation";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

const staffRoles = ["Manager", "Cashier", "Inventory staff", "Delivery staff"];

export default async function SellerStaffPage() {
  await requireRole(["SELLER", "ADMIN"]);
  return (
    <DashboardShell eyebrow="Seller" title="Staff management" description="Prepare employee roles and permissions for larger stores." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Staff members" value="0" icon={Users} helper="Future module" tone="sea" />
        <StatCard label="Roles" value={staffRoles.length} icon={UserCog} helper="Manager, cashier, inventory, delivery" tone="pink" />
        <StatCard label="Permissions" value="Ready" icon={Shield} helper="Designed for store teams" tone="yellow" />
      </div>
      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {staffRoles.map((role) => (
          <div key={role} className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">{role}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Future permission group for store employees. Owner approval will be required before staff can act.</p>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
