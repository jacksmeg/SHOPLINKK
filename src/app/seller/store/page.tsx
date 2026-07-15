import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Camera, Clock3, Globe2, MapPinned, Megaphone, MessageCircle, PackagePlus, Palette, Pencil, Phone, QrCode, Settings, Share2, ShieldCheck, Store, Truck, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { VerificationForm } from "@/components/seller/verification-form";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, chats, followers, reviews, pendingOrders] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id } }),
    prisma.product.count({ where: { sellerId: session.user.id } }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
    prisma.storeFollower.count({ where: { store: { ownerId: session.user.id } } }),
    prisma.review.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.foodOrder.count({ where: { store: { ownerId: session.user.id }, status: { in: ["PENDING_PAYMENT", "PAID", "PREPARING", "OUT_FOR_DELIVERY"] } } }),
  ]);
  const publicStorePath = store ? `/stores/${store.slug}` : "/seller/store/edit";

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Store management"
      description="Manage your public seller identity, contact details, store photos, verification, and buyer trust signals."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Store trust" value={`${store?.trustScore ?? 50}%`} icon={BadgeCheck} helper={`Verification: ${titleCase(store?.verificationStatus ?? "NOT_SUBMITTED")}`} tone="sea" />
        <StatCard label="Listings" value={products} icon={PackagePlus} helper="Products connected to this seller account" tone="pink" />
        <StatCard label="Buyer chats" value={chats} icon={MessageCircle} helper="Product-linked conversations" tone="yellow" />
        <StatCard label="Followers" value={followers} icon={Users} helper="People following your store" tone="blue" />
      </div>

      <section className="mt-5 overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-sm">
        <div className="relative aspect-[16/9] max-h-[340px] bg-[var(--surface-muted)]">
          {store?.coverUrl ? <Image src={store.coverUrl} alt={`${store.name} cover`} fill className="object-cover" unoptimized /> : <div className="grid h-full place-items-center text-[var(--muted)]"><Camera size={28} /></div>}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent px-5 pb-5 pt-14 text-white">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/75">Public store</p>
            <h2 className="mt-1 text-xl font-black">{store?.name ?? "Set up your store"}</h2>
            <p className="mt-1 text-xs text-white/80">{store?.area ? `${store.area}, ` : ""}{store?.location ?? "Dunkwa-on-Offin"}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm leading-6 text-[var(--muted)]">{store?.description || "Add a clear description so buyers know what your store sells."}</p>
              <div className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                <span><strong className="text-[var(--ink)]">Phone:</strong> {store?.phone || "Not added"}</span>
                <span><strong className="text-[var(--ink)]">WhatsApp:</strong> {store?.whatsapp || "Not added"}</span>
                <span><strong className="text-[var(--ink)]">Hours:</strong> {store?.openingHours || "Not added"}</span>
                <span><strong className="text-[var(--ink)]">Address:</strong> {store?.address || store?.area || "Not added"}</span>
              </div>
            </div>
            <ButtonLink href="/seller/store/edit"><Pencil size={15} /> Edit store</ButtonLink>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="app-panel p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Store profile checklist</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Keep these details complete so buyers can trust and find your business.</p>
            </div>
            <ButtonLink href="/seller/store/edit" variant="secondary"><Pencil size={15} /> Edit store</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Store, label: "Store name", value: store?.name || "Not added" },
              { icon: BadgeCheck, label: "Business category", value: store?.kind === "FOOD" ? "Food seller / restaurant" : "Products and services" },
              { icon: Phone, label: "Phone and WhatsApp", value: [store?.phone, store?.whatsapp].filter(Boolean).join(" / ") || "Not added" },
              { icon: MapPinned, label: "Address and GPS area", value: store?.address || store?.area || "Not added" },
              { icon: Clock3, label: "Opening hours", value: store?.openingHours || "Not added" },
              { icon: Truck, label: "Delivery coverage", value: store?.area ? `${store.area}, ${store.location}` : "Add coverage area" },
              { icon: Globe2, label: "Public URL", value: store ? `shoplinkk.com/store/${store.slug}` : "Create store first" },
              { icon: Palette, label: "Theme and banner", value: store?.coverUrl || store?.logoUrl ? "Brand photos added" : "Add logo and cover" },
            ].map((item) => (
              <div key={item.label} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]"><item.icon size={16} /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-[var(--ink)]">{item.label}</span>
                    <span className="mt-1 block truncate text-xs text-[var(--muted)]">{item.value}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={18} />
            <h2 className="text-sm font-black text-[var(--ink)]">Trust and performance</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[8px] bg-emerald-50 p-3 text-xs text-emerald-800"><strong>Verified badge:</strong> {store?.isVerified ? "Active" : "Submit documents for review"}</div>
            <div className="rounded-[8px] bg-blue-50 p-3 text-xs text-blue-900"><strong>Response rate:</strong> {store?.responseRate ?? 0}%</div>
            <div className="rounded-[8px] bg-yellow-50 p-3 text-xs text-yellow-900"><strong>Pending orders:</strong> {pendingOrders}</div>
            <div className="rounded-[8px] bg-pink-50 p-3 text-xs text-pink-900"><strong>Average rating:</strong> {(store?.ratingAverage ?? 0).toFixed(1)} from {store?.ratingCount ?? reviews.length} reviews</div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Link href={publicStorePath} className="app-panel app-panel-interactive p-4 sm:p-5">
          <Share2 className="text-[var(--brand)]" size={20} />
          <h2 className="mt-3 text-sm font-black text-[var(--ink)]">Store SEO and sharing</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Open the public store, copy the link, and share to WhatsApp, Facebook, or X.</p>
        </Link>
        <div className="app-panel p-4 sm:p-5">
          <QrCode className="text-[var(--brand)]" size={20} />
          <h2 className="mt-3 text-sm font-black text-[var(--ink)]">QR code</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Public QR generation is prepared for store sharing. Add a public store before printing QR codes.</p>
        </div>
        <div className="app-panel p-4 sm:p-5">
          <Settings className="text-[var(--brand)]" size={20} />
          <h2 className="mt-3 text-sm font-black text-[var(--ink)]">Store settings</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Accept orders, delivery, pickup, chat, calls, and vacation mode are managed from this store workspace as the app expands.</p>
        </div>
      </div>

      <div className="mt-6">
        <VerificationForm defaultName={store?.name} />
      </div>
    </DashboardShell>
  );
}
