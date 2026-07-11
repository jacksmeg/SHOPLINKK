import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { auditLog, notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  if (id === session.user.id) {
    return jsonError("Admins cannot block themselves");
  }

  const body = await request.json().catch(() => null);
  const active = body?.active !== false;

  await prisma.user.update({
    where: { id },
    data: {
      isBlocked: active,
      suspensionReason: active ? body?.reason ?? "Admin moderation" : null,
    },
  });

  await prisma.blockedUser.upsert({
    where: {
      blockedById_targetId: {
        blockedById: session.user.id,
        targetId: id,
      },
    },
    update: {
      active,
      reason: body?.reason ?? "Admin moderation",
    },
    create: {
      blockedById: session.user.id,
      targetId: id,
      active,
      reason: body?.reason ?? "Admin moderation",
    },
  });

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: active ? "USER_BLOCKED" : "USER_UNBLOCKED",
      targetType: "User",
      targetId: id,
      metadata: { reason: body?.reason ?? "Admin moderation" },
    }),
    notifyUser({
      userId: id,
      type: "SECURITY",
      title: active ? "Account suspended" : "Account restored",
      body: active ? body?.reason ?? "Admin moderation" : "Your ShopLinkk account has been restored.",
      href: "/account/security",
    }),
  ]);

  return NextResponse.json({ ok: true, active });
}
