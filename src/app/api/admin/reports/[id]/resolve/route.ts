import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api";
import { auditLog, notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const resolutionNote = typeof body?.resolutionNote === "string" ? body.resolutionNote : "Resolved by admin.";
  const { id } = await context.params;

  const report = await prisma.report.update({
    where: { id },
    data: {
      status: "RESOLVED",
      reviewedById: session.user.id,
      resolutionNote,
      resolvedAt: new Date(),
    },
    include: { reporter: { select: { id: true } } },
  });

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: "REPORT_RESOLVED",
      targetType: "Report",
      targetId: report.id,
      metadata: { resolutionNote },
    }),
    notifyUser({
      userId: report.reporter.id,
      type: "REPORT",
      title: "Report reviewed",
      body: resolutionNote,
      href: "/notifications",
    }),
  ]);

  return NextResponse.json(report);
}

