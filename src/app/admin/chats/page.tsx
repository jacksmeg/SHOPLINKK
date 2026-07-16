import Link from "next/link";
import { AlertTriangle, MessageCircle, Users } from "lucide-react";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  await requireRole(["ADMIN"]);
  const [conversations, reportedMessages] = await Promise.all([
    prisma.conversation.findMany({ include: { product: true, buyer: true, seller: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: 80 }),
    prisma.report.count({ where: { messageId: { not: null }, status: "OPEN" } }),
  ]);
  return (
    <DashboardShell eyebrow="Admin" title="Chat management" description="Review active chats and only inspect conversations when reported." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active chats" value={conversations.length} icon={MessageCircle} helper="Recent conversations" tone="sea" />
        <StatCard label="Participants" value={conversations.length * 2} icon={Users} helper="Buyer and seller accounts" tone="pink" />
        <StatCard label="Reported chats" value={reportedMessages} icon={AlertTriangle} helper="Needs admin review" tone="red" />
      </div>
      <div className="mt-5 grid gap-3">
        {conversations.map((chat) => (
          <article key={chat.id} className="app-panel app-panel-interactive p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/chat/${chat.id}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{chat.product.title}</Link>
                <p className="mt-1 text-xs text-[var(--muted)]">{chat.buyer.name || chat.buyer.email || "Buyer"} with {chat.seller.name || chat.seller.email || "Seller"}</p>
                <p className="mt-2 text-[0.68rem] text-[var(--muted)]">{chat.messages[0]?.body || "No messages yet"} - {compactDate(chat.updatedAt)}</p>
              </div>
              <AdminDeleteButton endpoint={`/api/admin/chats/${chat.id}`} label="Delete chat" confirmText="Delete this conversation and its messages?" />
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
