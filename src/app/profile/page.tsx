import { Shield, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileForm } from "@/components/forms/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      location: true,
      area: true,
      bio: true,
      image: true,
    },
  });

  return (
    <DashboardShell
      eyebrow="Account"
      title="Profile"
      description="Manage your photo, phone number, and location."
      links={[
        { href: "/profile", label: "Profile", icon: UserRound },
        { href: "/account/security", label: "Security", icon: Shield },
      ]}
    >
      <ProfileForm profile={profile ?? session.user} />
      <div className="mt-5 border-t border-[var(--line)] pt-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Account security</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Verify your email or phone number, change your password, or request account deletion.</p>
        <ButtonLink href="/account/security" variant="secondary" className="mt-4">Open security settings</ButtonLink>
      </div>
    </DashboardShell>
  );
}
