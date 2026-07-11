import { TownManager } from "@/components/admin/town-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTownsPage() {
  await requireRole(["ADMIN"]);
  const towns = await prisma.town.findMany({ include: { areas: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } });
  return <DashboardShell eyebrow="Admin" title="Towns and areas" description="Expand ShopLinkk from Dunkwa-on-Offin while keeping local browsing structured." links={adminLinks}><TownManager towns={towns} /></DashboardShell>;
}
