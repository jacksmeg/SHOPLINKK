import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat, Clock, MapPin, Phone, Store } from "lucide-react";
import { FoodModerationActions } from "@/components/admin/admin-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFoodReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const item = await prisma.foodMenuItem.findUnique({
    where: { id },
    include: {
      foodCategory: true,
      images: { orderBy: { sortOrder: "asc" } },
      options: { orderBy: { createdAt: "asc" } },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          whatsapp: true,
          momoNumber: true,
          area: true,
          location: true,
          address: true,
          isVerified: true,
          owner: { select: { name: true, email: true, phone: true, isBlocked: true } },
        },
      },
    },
  });

  if (!item) notFound();

  const images = item.images.length ? item.images : [{ id: "main", url: item.imageUrl || "/window.svg", alt: item.name }];

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Food review"
      description="Preview food photos, add-ons, prep time, restaurant details, and seller information before approval."
      links={adminLinks}
    >
      <div className="mb-4">
        <ButtonLink href="/admin/food" variant="secondary">
          <ArrowLeft size={16} />
          Back to food list
        </ButtonLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="app-panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.status === "APPROVED" ? "green" : item.status === "REJECTED" ? "red" : item.status === "DRAFT" ? "neutral" : "gold"}>{titleCase(item.status)}</Badge>
              {item.isAvailable ? <Badge tone="blue">Seller available</Badge> : <Badge tone="neutral">Hidden</Badge>}
              {item.isSpicy ? <Badge tone="red">Spicy</Badge> : null}
              {item.isVegetarian ? <Badge tone="green">Vegetarian</Badge> : null}
            </div>
            <h1 className="mt-3 text-xl font-black text-[var(--ink)]">{item.name}</h1>
            <p className="mt-2 text-lg font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.basePrice))}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-2 py-1"><ChefHat size={14} /> {item.foodCategory?.name || item.category || "Food"}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Clock size={14} /> Prep {item.prepMinutes ?? "?"} mins</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Clock size={14} /> Delivery {item.deliveryMinutes ?? "?"} mins</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)]">
                <Image src={image.url} alt={image.alt ?? item.name} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>

          <section className="mt-5 app-panel p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Food description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{item.description || "No description added by seller."}</p>
          </section>

          <section className="mt-5 app-panel p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Add-ons and choices</h2>
            <div className="mt-4 overflow-hidden rounded-[8px] border border-[var(--line)]">
              <table className="data-table w-full text-left text-xs">
                <thead className="bg-[var(--brand-dark)] text-white">
                  <tr>
                    <th className="px-4 py-3">Add-on</th>
                    <th className="px-4 py-3">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] bg-white">
                  {item.options.map((option) => (
                    <tr key={option.id}>
                      <td className="px-4 py-3 font-black text-[var(--ink)]">{option.name}</td>
                      <td className="px-4 py-3 text-[var(--brand-dark)]">{formatCurrency(Number(option.price))}</td>
                    </tr>
                  ))}
                  {!item.options.length ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center font-bold text-[var(--muted)]">No add-ons added.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <aside className="grid gap-4 self-start">
          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Moderation action</h2>
            <div className="mt-4">
              <FoodModerationActions itemId={item.id} />
            </div>
            {item.rejectionReason ? <p className="mt-3 rounded-[8px] bg-red-600 p-3 text-xs font-semibold text-white">{item.rejectionReason}</p> : null}
          </section>

          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Restaurant</h2>
            <Link href={`/stores/${item.store.slug}`} className="mt-2 inline-flex items-center gap-2 text-xs font-black text-[var(--brand-dark)]">
              <Store size={15} />
              {item.store.name}
            </Link>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.store.address || item.store.area || item.store.location}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.store.isVerified ? "Verified store" : "Not verified yet"}</p>
            <p className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--muted)]"><MapPin size={14} /> {item.store.area || item.store.location}</p>
            <p className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--muted)]"><Phone size={14} /> {item.store.phone || item.store.whatsapp || "No phone"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">MoMo: {item.store.momoNumber || item.store.phone || "Not set"}</p>
          </section>

          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Seller</h2>
            <p className="mt-2 text-xs font-bold text-[var(--ink)]">{item.store.owner.name || item.store.owner.email || "Seller"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.store.owner.email}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.store.owner.phone || "No phone"}</p>
            {item.store.owner.isBlocked ? <p className="mt-3 rounded-[8px] bg-red-600 p-3 text-xs font-semibold text-white">This seller is currently blocked.</p> : null}
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
