import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { formatGhanaPhone } from "@/lib/ghana";
import { verifyOtp } from "@/lib/sms";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reset-password", 8, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid reset request");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  if (parsed.data.email && parsed.data.token) {
    const email = parsed.data.email.toLowerCase();
    const identifier = `password-reset:${email}`;
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token: parsed.data.token,
        },
      },
    });

    if (!record || record.expires < new Date()) {
      return jsonError("Reset link is invalid or expired", 400);
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return jsonError("Reset link is invalid or expired", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token: parsed.data.token,
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  }

  if (parsed.data.phone && parsed.data.code) {
    const phone = formatGhanaPhone(parsed.data.phone);
    const providerVerified = await verifyOtp(phone, parsed.data.code);
    const identifier = `password-reset-phone:${phone}`;
    const token =
      providerVerified === null
        ? await prisma.verificationToken.findFirst({
            where: {
              identifier,
              token: { startsWith: `${parsed.data.code}-` },
              expires: { gt: new Date() },
            },
          })
        : null;

    if (providerVerified === false || (providerVerified === null && !token)) {
      return jsonError("Code is invalid or expired", 400);
    }

    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!user) {
      return jsonError("Code is invalid or expired", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      if (token) {
        await tx.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: token.identifier,
              token: token.token,
            },
          },
        });
      } else {
        await tx.verificationToken.deleteMany({ where: { identifier } });
      }
    });

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  }

  return jsonError("Use the email reset link or enter the SMS reset code", 400);
}
