import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);
  const config = await getPlatformConfig();
  return <DashboardShell eyebrow="Admin" title="Platform settings" description="Control registration, verification, listing review, safety messaging, and marketplace defaults." links={adminLinks}><PlatformSettingsForm config={config} /></DashboardShell>;
}
