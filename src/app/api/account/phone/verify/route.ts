import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { verifyOtp } from "@/lib/sms";
import { phoneOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = phoneOtpSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid code");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  if (!user?.phone) {
    return jsonError("Add a phone number first");
  }

  const providerVerified = await verifyOtp(user.phone, parsed.data.code);
  const token =
    providerVerified === null
      ? await prisma.verificationToken.findFirst({
          where: {
            identifier: `phone-verify:${session.user.id}:${user.phone}`,
            token: { startsWith: `${parsed.data.code}-` },
            expires: { gt: new Date() },
          },
        })
      : null;

  if (providerVerified === false || (providerVerified === null && !token)) {
    return jsonError("Code is invalid or expired", 400);
  }

  if (token) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { phoneVerifiedAt: new Date() },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: token.identifier,
            token: token.token,
          },
        },
      }),
    ]);
  } else {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phoneVerifiedAt: new Date() },
    });
  }

  await notifyUser({
    userId: session.user.id,
    type: "SECURITY",
    title: "Phone verified",
    body: "Your phone number is now verified on ShopLinkk.",
    href: "/profile",
  });

  return NextResponse.json({ ok: true });
}
