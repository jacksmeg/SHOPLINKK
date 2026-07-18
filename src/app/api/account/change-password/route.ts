import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid password data");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return jsonError("Account not found", 404);
  }

  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return jsonError("Enter your current password", 400);
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return jsonError("Current password is incorrect", 403);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  await notifyUser({
    userId: user.id,
    type: "SECURITY",
    title: user.passwordHash ? "Password changed" : "Password created",
    body: user.passwordHash
      ? "Your ShopLinkk password was changed successfully."
      : "A password was added to your ShopLinkk account successfully.",
    href: "/account/security",
  });

  return NextResponse.json({
    ok: true,
    message: user.passwordHash ? "Password changed successfully." : "Password created successfully.",
  });
}
