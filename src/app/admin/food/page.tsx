import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, MapPin } from "lucide-react";
import type { FoodMenuStatus } from "@/generated/prisma/client";
import { FoodModerationActions } from "@/components/admin/admin-actions";
import { FoodCategoryManager } from "@/components/admin/food-category-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { getFoodCategories } from "@/lib/food-categories";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function AdminFoodPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const status = value(params, "status") ?? "";
  const q = value(params, "q") ?? "";
  const statusFilter = ["PENDING", "APPROVED", "REJECTED", "DRAFT"].includes(status) ? status as FoodMenuStatus : undefined;
  const [items, foodCategories] = await Promise.all([
    prisma.foodMenuItem.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { foodCategory: { name: { contains: q, mode: "insensitive" } } },
                { store: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        foodCategory: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        options: true,
        store: { select: { name: true, slug: true, area: true, location: true, owner: { select: { name: true, email: true } } } },
      },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    }),
    getFoodCategories({ activeOnly: false }),
  ]);

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Food menu"
      description="Approve food items before buyers can see or order them."
      links={adminLinks}
    >
      <FoodCategoryManager categories={foodCategories} />

      <form className="mb-4 grid gap-2 rounded-[8px] border border-[var(--line)] bg-white p-3 sm:grid-cols-[1fr_180px_auto]">
        <input name="q" defaultValue={q} placeholder="Search food, store, category..." className="form-control px-3 text-xs" />
        <select name="status" defaultValue={status} className="form-control bg-white px-3 text-xs">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button className="min-h-10 rounded-[7px] bg-[var(--brand)] px-4 text-xs font-semibold text-white" type="submit">
          Filter
        </button>
      </form>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const image = item.images[0]?.url ?? item.imageUrl ?? "/window.svg";
            return (
              <article key={item.id} className="app-panel p-4">
                <div className="grid gap-4 md:grid-cols-[96px_1fr_auto]">
                  <div className="relative aspect-square overflow-hidden rounded-[8px] bg-[var(--surface-muted)]">
                    <Image src={image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/food/${item.id}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand)]">{item.name}</Link>
                      <Badge tone={item.status === "APPROVED" ? "green" : item.status === "REJECTED" ? "red" : item.status === "DRAFT" ? "neutral" : "gold"}>{titleCase(item.status)}</Badge>
                      {item.isAvailable ? <Badge tone="blue">Seller available</Badge> : <Badge tone="neutral">Hidden</Badge>}
                    </div>
                    <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.basePrice))}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.description || "No description."}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold text-[var(--muted)]">
                      <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item.foodCategory?.name || item.category || "Food"}</span>
                      {item.prepMinutes ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Clock size={12} /> {item.prepMinutes} mins</span> : null}
                      <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item.options.length} add-ons</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><MapPin size={12} /> {item.store.area || item.store.location}</span>
                    </div>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      Store: <a href={`/stores/${item.store.slug}`} className="font-black text-[var(--brand-dark)]">{item.store.name}</a> by {item.store.owner.name || item.store.owner.email}
                    </p>
                    <Link href={`/admin/food/${item.id}`} className="mt-3 inline-flex text-xs font-black text-[var(--brand-dark)]">
                      View before approval
                    </Link>
                    {item.rejectionReason ? <p className="mt-2 rounded-[7px] bg-red-50 p-2 text-xs font-semibold text-red-700">{item.rejectionReason}</p> : null}
                  </div>
                  <div className="md:min-w-[210px]">
                    <FoodModerationActions itemId={item.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No food items found" description="Food menu items needing approval will appear here." icon={ChefHat} />
      )}
    </DashboardShell>
  );
}
