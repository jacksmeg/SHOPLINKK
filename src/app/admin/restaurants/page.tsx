import Link from "next/link";
import { ChefHat, Clock, PackageCheck, ShoppingBasket } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  await requireRole(["ADMIN"]);
  const restaurants = await prisma.store.findMany({
    where: { kind: "FOOD" },
    include: { owner: { select: { name: true, email: true, phone: true } }, foodMenuItems: true, foodOrders: true },
    orderBy: { createdAt: "desc" },
  });
  const orders = restaurants.flatMap((store) => store.foodOrders);
  const revenue = orders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalAmount), 0);
  return (
    <DashboardShell eyebrow="Admin" title="Restaurant management" description="Manage food sellers, menus, categories, opening hours, delivery availability, and food approvals." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Restaurants" value={restaurants.length} icon={ChefHat} helper="Food stores" tone="sea" />
        <StatCard label="Menu items" value={restaurants.reduce((sum, store) => sum + store.foodMenuItems.length, 0)} icon={PackageCheck} helper="All food items" tone="pink" />
        <StatCard label="Food orders" value={orders.length} icon={ShoppingBasket} helper="All restaurant orders" tone="yellow" />
        <StatCard label="Order value" value={formatCurrency(revenue)} icon={Clock} helper="Non-cancelled total" tone="purple" />
      </div>
      <div className="mt-5 grid gap-3">
        {restaurants.map((store) => (
          <article key={store.id} className="app-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/stores/${store.slug}`} className="text-sm font-black text-[var(--brand-dark)]">{store.name}</Link>
                <p className="mt-1 text-xs text-[var(--muted)]">{store.owner.name || store.owner.email || store.owner.phone} - {store.area || store.location}</p>
              </div>
              <Badge tone={store.isVerified ? "green" : "gold"}>{titleCase(store.verificationStatus)}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
              <span className="rounded-[8px] bg-[var(--surface-muted)] p-3">{store.foodMenuItems.length} menu items</span>
              <span className="rounded-[8px] bg-[var(--surface-muted)] p-3">{store.foodOrders.length} orders</span>
              <span className="rounded-[8px] bg-[var(--surface-muted)] p-3">{store.openingHours || "No hours"}</span>
              <span className="rounded-[8px] bg-[var(--surface-muted)] p-3">{store.deliveryAvailable ? "Delivery on" : "Delivery off"}</span>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
