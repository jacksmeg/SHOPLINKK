import { Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  return (
    <DashboardShell
      eyebrow="Messages"
      title="Conversation"
      description="Near real-time chat updates every few seconds."
      links={[
        { href: "/buyer", label: "Buyer overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <ChatWindow conversationId={id} currentUserId={session.user.id} />
    </DashboardShell>
  );
}
