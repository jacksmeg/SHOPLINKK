import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/email-template";
import { formatGhanaPhone } from "@/lib/ghana";
import { createOtp, isPhoneOtpProviderEnabled, sendOtp } from "@/lib/sms";
import { forgotPasswordSchema, ghanaPhoneSchema } from "@/lib/validators";

async function sendPasswordResetEmail(email: string) {
  const token = randomUUID();
  const identifier = `password-reset:${email}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const resetUrl = appUrl(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
  const emailContent = brandedEmail({
    title: "Reset your ShopLinkk password",
    intro: "Use this secure link to create a new password for your ShopLinkk account.",
    body: "This link expires in 30 minutes. If you did not request it, you can ignore this email.",
    ctaLabel: "Reset password",
    ctaUrl: resetUrl,
  });

  await sendEmail({
    to: email,
    subject: "Reset your ShopLinkk password",
    text: emailContent.text,
    html: emailContent.html,
  });
}

async function sendPhoneResetCode(phone: string) {
  const code = createOtp();
  const identifier = `password-reset-phone:${phone}`;
  const remoteProviderEnabled = await isPhoneOtpProviderEnabled();

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  if (!remoteProviderEnabled) {
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: `${code}-${randomUUID()}`,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  await sendOtp(phone, code);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", 6, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      message: "Enter your email, username, or Ghana phone number.",
    });
  }

  const identifier = parsed.data.identifier.trim();
  const parsedPhone = ghanaPhoneSchema.safeParse(identifier);

  if (parsedPhone.success) {
    const phone = formatGhanaPhone(parsedPhone.data);

    try {
      const user = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (user) {
        await sendPhoneResetCode(phone);
      }
    } catch {
      // Keep response generic so account existence is not exposed.
    }

    return NextResponse.json({
      resetMode: "phone",
      phone,
      message: "If this phone number exists, a six-digit reset code has been sent by SMS.",
    });
  }

  try {
    const lookup = identifier.toLowerCase();
    const user = lookup.includes("@")
      ? await prisma.user.findUnique({ where: { email: lookup }, select: { email: true } })
      : await prisma.user.findUnique({ where: { username: lookup }, select: { email: true } });

    if (user?.email) {
      await sendPasswordResetEmail(user.email.toLowerCase());
    }
  } catch {
    // Keep response generic so account existence is not exposed.
  }

  return NextResponse.json({
    resetMode: "email",
    message: "If that account exists, reset instructions will be sent by email.",
  });
}
