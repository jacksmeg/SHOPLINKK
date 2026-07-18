import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { formatGhanaPhone } from "@/lib/ghana";
import { createLoginGuard } from "@/lib/login-guard";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { loginSchema } from "@/lib/validators";

async function findUserForLogin(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (value.includes("@")) return prisma.user.findUnique({ where: { email: value } });
  if (/^(\+233|0)?[235][0-9]{8}$/.test(value.replace(/[\s-]/g, ""))) {
    return prisma.user.findUnique({ where: { phone: formatGhanaPhone(value) } });
  }
  return prisma.user.findUnique({ where: { username: value } });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "check-login", 10, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Enter your username, email or phone number and password.", 400);
  }

  const turnstile = await verifyTurnstileToken((body as { turnstileToken?: unknown } | null)?.turnstileToken, request);
  if (!turnstile.ok) {
    return jsonError(turnstile.message, 400);
  }

  const user = await findUserForLogin(parsed.data.identifier);

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "No ShopLinkk account was found with that username, email, or phone number." },
      { status: 401 },
    );
  }

  if (user.isBlocked) {
    return NextResponse.json(
      { ok: false, message: user.suspensionReason ? `This account is blocked: ${user.suspensionReason}` : "This account has been blocked. Contact ShopLinkk support." },
      { status: 403 },
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { ok: false, message: "This account does not have a password yet. Use Google sign-in or reset your password." },
      { status: 401 },
    );
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json(
      { ok: false, message: "The password is not correct for this account." },
      { status: 401 },
    );
  }

  const loginGuard = await createLoginGuard(parsed.data.identifier);
  return NextResponse.json({ ok: true, loginGuard });
}
