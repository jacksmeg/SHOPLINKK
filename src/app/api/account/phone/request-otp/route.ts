import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { createOtp, isPhoneOtpProviderEnabled, sendOtp } from "@/lib/sms";
import { formatGhanaPhone } from "@/lib/ghana";
import { ghanaPhoneSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "phone:otp", 5, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  if (!user) {
    return jsonError("Account not found", 404);
  }

  let phone = user.phone;
  const requestedPhone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (requestedPhone) {
    const parsedPhone = ghanaPhoneSchema.safeParse(requestedPhone);
    if (!parsedPhone.success) {
      return jsonError(parsedPhone.error.issues[0]?.message ?? "Enter a valid Ghana phone number");
    }

    phone = formatGhanaPhone(parsedPhone.data);
    const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (phoneOwner && phoneOwner.id !== session.user.id) {
      return jsonError("Another ShopLinkk account already uses this phone number", 409);
    }

    if (phone !== user.phone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone, phoneVerifiedAt: null },
      });
    }
  }

  if (!phone) {
    return jsonError("Add a phone number first");
  }

  const code = createOtp();
  const remoteProviderEnabled = await isPhoneOtpProviderEnabled();

  if (!remoteProviderEnabled) {
    await prisma.verificationToken.create({
      data: {
        identifier: `phone-verify:${session.user.id}:${phone}`,
        token: `${code}-${randomUUID()}`,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  try {
    await sendOtp(phone, code);
  } catch {
    return jsonError("We could not send a verification code to this number. Check the number and try again.", 502);
  }

  return NextResponse.json({ ok: true, message: "A six-digit verification code was sent by SMS." });
}
