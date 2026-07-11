import { LockKeyhole } from "lucide-react";
import { IntegrationForm } from "@/components/admin/integration-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { integrationDefinitions } from "@/lib/integration-definitions";
import { getIntegrationSummaries } from "@/lib/integration-settings";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  await requireRole(["ADMIN"]);
  const summaries = await getIntegrationSummaries();

  return (
    <DashboardShell eyebrow="Admin" title="API connections" description="Connect the services ShopLinkk uses for sign-in, email, media, phone verification, realtime updates, and monitoring." links={adminLinks}>
      <div className="mb-4 flex gap-3 rounded-[8px] border border-cyan-200 bg-[var(--gold-soft)] p-4 text-xs leading-5 text-cyan-950">
        <LockKeyhole className="mt-0.5 shrink-0" size={17} />
        <p>Secret values are encrypted before storage and are never displayed again. Set a strong <code>INTEGRATION_ENCRYPTION_KEY</code> in production before adding provider credentials.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {integrationDefinitions.map((definition) => {
          const summary = summaries.find((item) => item.provider === definition.provider)!;
          return (
            <IntegrationForm
              key={definition.provider}
              definition={definition}
              summary={{ ...summary, lastTestedAt: summary.lastTestedAt?.toISOString() ?? null }}
            />
          );
        })}
      </div>
    </DashboardShell>
  );
}
