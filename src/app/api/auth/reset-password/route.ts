import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reset-password", 8, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid reset request");
  }

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

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier,
        token: parsed.data.token,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
