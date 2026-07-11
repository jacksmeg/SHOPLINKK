import { AlertTriangle, Bell, Heart, MessageCircle, Search, Shield, ShoppingBag, UserRound } from "lucide-react";
import { SecurityForms } from "@/components/account/security-forms";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailVerified: true,
      email: true,
      phone: true,
      phoneVerifiedAt: true,
      isBlocked: true,
      suspensionReason: true,
      deleteRequestedAt: true,
    },
  });

  return (
    <DashboardShell
      eyebrow="Account"
      title="Verification & security"
      description="Verify your email or phone, manage your password, and keep your account safe."
      links={[
        { href: "/buyer", label: "Buyer overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: UserRound },
        { href: "/account/security", label: "Security", icon: Shield },
      ]}
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="app-panel p-4">
          <p className="text-xs text-[var(--muted)]">Email</p>
          <Badge tone={user?.emailVerified ? "green" : "gold"}>{user?.emailVerified ? "Verified" : "Not verified"}</Badge>
        </div>
        <div className="app-panel p-4">
          <p className="text-xs text-[var(--muted)]">Phone</p>
          <Badge tone={user?.phoneVerifiedAt ? "green" : "gold"}>{user?.phoneVerifiedAt ? "Verified" : "Not verified"}</Badge>
        </div>
        <div className="app-panel p-4">
          <p className="text-xs text-[var(--muted)]">Account deletion</p>
          <Badge tone={user?.deleteRequestedAt ? "gold" : "neutral"}>{user?.deleteRequestedAt ? "Requested" : "None"}</Badge>
        </div>
      </div>

      {user?.isBlocked ? (
        <div className="mb-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <strong className="inline-flex items-center gap-2"><AlertTriangle size={16} /> Account suspended:</strong> {user.suspensionReason || "Contact ShopLinkk support for details."}
        </div>
      ) : null}

      <SecurityForms
        email={user?.email}
        phone={user?.phone}
        emailVerified={Boolean(user?.emailVerified)}
        phoneVerified={Boolean(user?.phoneVerifiedAt)}
      />
    </DashboardShell>
  );
}
