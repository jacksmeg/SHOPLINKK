import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const session = await requireUser();
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: session.user.id },
              readAt: null,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DashboardShell
      eyebrow="Messages"
      title="Chats"
      description="Every buyer-seller chat stays connected to a product."
      links={[
        { href: "/buyer", label: "Buyer overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      {conversations.length ? (
        <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white">
          {conversations.map((conversation) => {
            const other =
              conversation.buyer.id === session.user.id ? conversation.seller : conversation.buyer;
            const last = conversation.messages[0];

            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="flex gap-3 border-b border-[var(--line)] p-3 transition last:border-b-0 hover:bg-[var(--surface-muted)] sm:p-4"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-[7px] bg-[var(--surface-muted)] sm:size-16">
                  {conversation.product.images[0]?.url ? (
                    <Image src={conversation.product.images[0].url} alt={conversation.product.title} fill className="object-cover" unoptimized />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="line-clamp-1 text-sm font-black text-[var(--ink)]">{conversation.product.title}</h2>
                    <span className="text-xs text-[var(--muted)]">{compactDate(conversation.updatedAt)}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[var(--brand-dark)]">With {other.name ?? "ShopLinkk user"}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                    {last?.body ?? "No messages yet. Start the conversation."}
                  </p>
                  {conversation._count.messages ? (
                    <span className="mt-2 inline-flex rounded-full bg-[var(--brand)] px-2.5 py-1 text-xs font-black text-white">
                      {conversation._count.messages} unread
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No chats yet"
          description="Open a product and use Contact seller to start a product-linked chat."
          actionHref="/marketplace"
          actionLabel="Find products"
        />
      )}
    </DashboardShell>
  );
}
