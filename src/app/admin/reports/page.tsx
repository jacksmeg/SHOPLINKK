import Link from "next/link";
import { ReportResolveAction } from "@/components/admin/admin-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, titleCase } from "@/lib/utils";
import { adminLinks } from "@/lib/admin-navigation";
import type { Prisma, ReportStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const q = String(params.q ?? "");
  const status = String(params.status ?? "");
  const where: Prisma.ReportWhereInput = {};
  if (status) where.status = status as ReportStatus;
  if (q) where.OR = [{ reason: { contains: q, mode: "insensitive" } }, { details: { contains: q, mode: "insensitive" } }, { reporter: { email: { contains: q, mode: "insensitive" } } }];
  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: { select: { name: true, email: true } },
      reportedUser: { select: { name: true, email: true } },
      product: { select: { title: true, slug: true } },
      message: { select: { body: true, conversationId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Reports"
      description="Review reported products and sellers."
      links={adminLinks}
    >
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
        <input name="q" defaultValue={q} placeholder="Search reports..." className="form-control px-3 text-xs" />
        <select name="status" defaultValue={status} className="form-control bg-white px-3 text-xs"><option value="">All statuses</option><option value="OPEN">Open</option><option value="REVIEWED">Reviewed</option><option value="RESOLVED">Resolved</option></select>
        <button className="min-h-10 rounded-[7px] bg-[var(--brand)] px-4 text-xs font-semibold text-white">Filter</button>
      </form>
      <div className="grid gap-4">
        {reports.map((report) => (
          <article key={report.id} className="app-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={report.status === "OPEN" ? "red" : "neutral"}>{titleCase(report.status)}</Badge>
              <span className="text-xs text-[var(--muted)]">{compactDate(report.createdAt)}</span>
            </div>
            <h2 className="mt-4 text-sm font-black text-[var(--ink)]">{report.reason}</h2>
            {report.details ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{report.details}</p> : null}
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <p>Reporter: {report.reporter.name ?? report.reporter.email}</p>
              {report.reportedUser ? <p>Reported user: {report.reportedUser.name ?? report.reportedUser.email}</p> : null}
              {report.product ? (
                <p>
                  Product: <Link href={`/products/${report.product.slug}`} className="font-bold text-[var(--brand-dark)]">{report.product.title}</Link>
                </p>
              ) : null}
              {report.message ? (
                <p>
                  Message: <Link href={`/chat/${report.message.conversationId}`} className="font-bold text-[var(--brand-dark)]">{report.message.body.slice(0, 80)}</Link>
                </p>
              ) : null}
              {report.resolutionNote ? <p>Resolution: {report.resolutionNote}</p> : null}
            </div>
            {report.status !== "RESOLVED" ? (
              <div className="mt-4">
                <ReportResolveAction reportId={report.id} />
              </div>
            ) : null}
          </article>
        ))}
        {!reports.length ? (
          <div className="rounded-[8px] border border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            No reports have been submitted.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
