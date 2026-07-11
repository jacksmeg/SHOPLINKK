import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { deleteAccountSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request");
  }

  const deletion = await prisma.accountDeletionRequest.create({
    data: {
      userId: session.user.id,
      reason: parsed.data.reason,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { deleteRequestedAt: new Date() },
  });

  await notifyUser({
    userId: session.user.id,
    type: "SECURITY",
    title: "Delete account request received",
    body: "ShopLinkk support will review your delete account request.",
    href: "/account/security",
  });

  return NextResponse.json(deletion, { status: 201 });
}

