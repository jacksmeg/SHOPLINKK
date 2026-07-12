import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditLog, notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { adminRiderDecisionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = adminRiderDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a rider action");

  const rider = await prisma.riderProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!rider) return jsonError("Rider not found", 404);

  const now = new Date();
  const data =
    parsed.data.action === "APPROVE"
      ? { status: "APPROVED" as const, approvedAt: now, reviewedById: session.user.id, rejectionReason: null, suspensionReason: null }
      : parsed.data.action === "REJECT"
        ? { status: "REJECTED" as const, reviewedById: session.user.id, rejectionReason: parsed.data.note || "Application rejected" }
        : parsed.data.action === "SUSPEND"
          ? { status: "SUSPENDED" as const, reviewedById: session.user.id, suspensionReason: parsed.data.note || "Rider suspended", availability: "OFFLINE" as const }
          : { status: "APPROVED" as const, reviewedById: session.user.id, suspensionReason: null };

  const updated = await prisma.riderProfile.update({ where: { id }, data });
  const action =
    parsed.data.action === "APPROVE"
      ? "RIDER_APPROVED"
      : parsed.data.action === "REJECT"
        ? "RIDER_REJECTED"
        : "RIDER_SUSPENDED";

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action,
      targetType: "RiderProfile",
      targetId: rider.id,
      metadata: { rider: rider.user.name, note: parsed.data.note || null },
    }),
    notifyUser({
      userId: rider.user.id,
      type: "SYSTEM",
      title: parsed.data.action === "APPROVE" ? "Rider account approved" : "Rider account updated",
      body:
        parsed.data.action === "APPROVE"
          ? "You can now go online and accept ShopLinkk deliveries."
          : parsed.data.note || "Your rider account status changed.",
      href: "/rider",
    }),
  ]);

  return NextResponse.json({ rider: updated });
}
