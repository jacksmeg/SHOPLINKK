import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { formatGhanaPhone } from "@/lib/ghana";
import { getPlatformConfig } from "@/lib/platform-settings";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "check-login", 10, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Enter your email or phone number and password.", 400);
  }

  const identifier = parsed.data.identifier.trim();
  const user = identifier.includes("@")
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: formatGhanaPhone(identifier) } });

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "No ShopLinkk account was found with that email or phone number." },
      { status: 401 },
    );
  }

  if (user.isBlocked) {
    return NextResponse.json(
      { ok: false, message: user.suspensionReason ? `This account is blocked: ${user.suspensionReason}` : "This account has been blocked. Contact ShopLinkk support." },
      { status: 403 },
    );
  }

  const platform = await getPlatformConfig();
  if (platform.requireEmailVerification && !user.emailVerified) {
    return NextResponse.json(
      { ok: false, message: "Your email is not verified yet. Open the verification link sent to your email." },
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

  return NextResponse.json({ ok: true });
}
