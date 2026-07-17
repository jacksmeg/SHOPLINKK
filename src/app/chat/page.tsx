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
  const groupedConversations = Array.from(
    conversations.reduce(
      (groups, conversation) => {
        const other = conversation.buyer.id === session.user.id ? conversation.seller : conversation.buyer;
        const key = other.id;
        const existing =
          groups.get(key) ??
          ({
            user: other,
            conversations: [] as typeof conversations,
            unread: 0,
            updatedAt: conversation.updatedAt,
          });

        existing.conversations.push(conversation);
        existing.unread += conversation._count.messages;
        if (conversation.updatedAt > existing.updatedAt) existing.updatedAt = conversation.updatedAt;
        groups.set(key, existing);
        return groups;
      },
      new Map<
        string,
        {
          user: (typeof conversations)[number]["buyer"];
          conversations: typeof conversations;
          unread: number;
          updatedAt: Date;
        }
      >(),
    ).values(),
  ).sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime());

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
        <div className="grid gap-4">
          {groupedConversations.map((group) => (
            <section key={group.user.id} className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-muted)] p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--brand-dark)] text-sm font-black text-white">
                    {group.user.image ? <Image src={group.user.image} alt="" fill className="object-cover" unoptimized /> : group.user.name?.charAt(0) ?? "S"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-[var(--ink)]">{group.user.name ?? "ShopLinkk user"}</h2>
                    <p className="text-xs text-[var(--muted)]">
                      {group.conversations.length} product chat{group.conversations.length === 1 ? "" : "s"} - last active {compactDate(group.updatedAt)}
                    </p>
                  </div>
                </div>
                {group.unread ? (
                  <span className="rounded-full bg-[var(--tone-pink)] px-2.5 py-1 text-xs font-black text-white">
                    {group.unread} unread
                  </span>
                ) : null}
              </div>

              <div>
                {group.conversations.map((conversation) => {
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
                          <h3 className="line-clamp-1 text-sm font-black text-[var(--ink)]">{conversation.product.title}</h3>
                          <span className="text-xs text-[var(--muted)]">{compactDate(conversation.updatedAt)}</span>
                        </div>
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
            </section>
          ))}
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
