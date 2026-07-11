import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, titleCase } from "@/lib/utils";
import { adminLinks } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  await requireRole(["ADMIN"]);
  const logs = await prisma.adminAuditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Audit log"
      description="A record of sensitive admin actions."
      links={adminLinks}
    >
      <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-blue-50 text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-dark)]">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4"><Badge tone="blue">{titleCase(log.action)}</Badge></td>
                  <td className="px-4 py-4 text-[var(--muted)]">{log.actor.name ?? log.actor.email}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{log.targetType} {log.targetId ?? ""}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{compactDate(log.createdAt)}</td>
                </tr>
              ))}
              {!logs.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">No admin actions yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
