import { MapPinned, Store, Truck, Users } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { townLocations } from "@/lib/demo-data";
import { dunkwaAreas } from "@/lib/ghana";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  await requireRole(["ADMIN"]);
  const [towns, stores, users, riders] = await Promise.all([prisma.town.count(), prisma.store.count(), prisma.user.count(), prisma.riderProfile.count()]);
  return (
    <AdminModulePage
      title="Location management"
      description="Manage regions, towns, communities, delivery zones, expansion areas, and local Ghana browsing."
      stats={[
        { label: "Towns", value: towns || townLocations.length, icon: MapPinned, helper: "Expansion towns", tone: "sea" },
        { label: "Dunkwa areas", value: dunkwaAreas.length, icon: MapPinned, helper: "Local pickup areas", tone: "pink" },
        { label: "Stores", value: stores, icon: Store, helper: "Located businesses", tone: "yellow" },
        { label: "Riders", value: riders, icon: Truck, helper: "Delivery coverage", tone: "blue" },
        { label: "Users", value: users, icon: Users, helper: "Customer base", tone: "purple" },
      ]}
      actions={[
        { title: "Dunkwa-on-Offin areas", body: dunkwaAreas.slice(0, 12).join(", "), href: "/admin/towns" },
        { title: "Nearby towns", body: townLocations.filter((town) => town !== "Dunkwa-on-Offin").join(", "), href: "/admin/towns" },
        { title: "Delivery zones", body: "Use rider and store GPS fields for future zone-based pricing and assignments.", href: "/admin/deliveries" },
      ]}
    />
  );
}
