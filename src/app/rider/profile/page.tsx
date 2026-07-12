import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RiderApplicationForm } from "@/components/rider/rider-application-form";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";

export const dynamic = "force-dynamic";

export default async function RiderProfilePage() {
  const session = await requireUser();
  if (session.user.role !== "RIDER" && session.user.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user) redirect("/login");
  }

  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });

  return (
    <DashboardShell
      eyebrow="Rider"
      title="Rider application"
      description="Upload identity, license, vehicle documents, emergency contact, and future payout details."
      links={riderLinks}
    >
      <div className="mb-5 rounded-[10px] border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-950">
        <strong>Status:</strong> {profile?.status?.toLowerCase().replace(/_/g, " ") || "not submitted"}. Admin will review your Ghana Card, driver license, vehicle document, and contact details before you can go online.
      </div>
      <RiderApplicationForm profile={profile} />
      {session.user.role !== "RIDER" ? (
        <div className="mt-5 app-panel p-4">
          <p className="text-xs text-[var(--muted)]">After submitting, this account will become a rider account.</p>
          <ButtonLink href="/rider" className="mt-3" variant="secondary">Open rider dashboard</ButtonLink>
        </div>
      ) : null}
    </DashboardShell>
  );
}
