import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reports:create", 12, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid report");
  }

  if (!parsed.data.productId && !parsed.data.reportedUserId && !parsed.data.messageId) {
    return jsonError("Report a product, user, or message");
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      productId: parsed.data.productId,
      messageId: parsed.data.messageId,
      reportedUserId: parsed.data.reportedUserId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });

  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "REPORT",
        title: "New safety report",
        body: parsed.data.reason,
        href: "/admin/reports",
      }),
    ),
  );
  const alertEmails = Array.from(
    new Set([
      ...admins.map((admin) => admin.email).filter(Boolean),
      process.env.ADMIN_ALERT_EMAIL || null,
    ].filter((email): email is string => Boolean(email))),
  );

  await Promise.all(
    alertEmails.map((email) =>
      sendEmail({
        to: email,
        subject: "New ShopLinkk safety report",
        html: `<p>A new report was submitted.</p><p><strong>${parsed.data.reason}</strong></p><p>${parsed.data.details ?? ""}</p><p><a href="${appUrl()}/admin/reports">Open reports</a></p>`,
      }),
    ),
  );

  return NextResponse.json(report, { status: 201 });
}
