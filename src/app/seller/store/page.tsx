import Image from "next/image";
import { BadgeCheck, Camera, MessageCircle, PackagePlus, Megaphone, Pencil, Settings, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { VerificationForm } from "@/components/seller/verification-form";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, chats] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id } }),
    prisma.product.count({ where: { sellerId: session.user.id } }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
  ]);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Store management"
      description="Manage your public seller identity, contact details, store photos, verification, and buyer trust signals."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/store", label: "Store management", icon: Settings },
        { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Store trust" value={`${store?.trustScore ?? 50}%`} icon={BadgeCheck} helper={`Verification: ${titleCase(store?.verificationStatus ?? "NOT_SUBMITTED")}`} />
        <StatCard label="Listings" value={products} icon={PackagePlus} helper="Products connected to this seller account" />
        <StatCard label="Buyer chats" value={chats} icon={MessageCircle} helper="Product-linked conversations" />
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

      <div className="mt-6">
        <VerificationForm defaultName={store?.name} />
      </div>
    </DashboardShell>
  );
}
