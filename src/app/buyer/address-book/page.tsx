import { MapPinned, Phone } from "lucide-react";
import { AddressBookManager } from "@/components/buyer/address-book-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BuyerAddressBookPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true, location: true, area: true } });
  const defaultAddress = [user?.area, user?.location].filter(Boolean).join(", ");

  return (
    <DashboardShell eyebrow="Buyer" title="Address book" description="Save home, work, school, and GPS delivery points for food and rider requests." links={buyerLinks}>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Default phone" value={user?.phone || "Not set"} icon={Phone} helper="Used during checkout" tone="sea" />
        <StatCard label="Default area" value={defaultAddress || "Not set"} icon={MapPinned} helper="Use GPS for exact location" tone="pink" />
      </div>
      <AddressBookManager defaultPhone={user?.phone} defaultAddress={defaultAddress} />
    </DashboardShell>
  );
}
