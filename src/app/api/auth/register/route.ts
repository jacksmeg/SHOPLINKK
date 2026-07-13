import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/email-template";
import { slugify, uniqueSlug } from "@/lib/slug";
import { registerSchema } from "@/lib/validators";
import { formatGhanaPhone } from "@/lib/ghana";
import { createLoginGuard } from "@/lib/login-guard";
import { getPlatformConfig } from "@/lib/platform-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { TERMS_VERSION } from "@/lib/legal";

function registrationErrorMessage(issues: { path: PropertyKey[]; message: string }[]) {
  const first = issues[0];
  const field = String(first?.path?.[0] ?? "");
  const labels: Record<string, string> = {
    name: "Full name",
    username: "Username",
    email: "Email",
    password: "Password",
    phone: "Phone number",
    location: "Location",
    role: "Account type",
  };

  if (field === "email") return "Email: enter a valid email address.";
  if (field === "username") return "Username: use 3-30 letters, numbers, or underscore.";
  if (field === "phone") return "Phone number: use a valid Ghana number, for example 024 000 0000.";
  if (field === "password") return "Password: use at least 8 characters.";

  return first ? `${labels[field] ?? "Form"}: ${first.message}` : "Check the form and try again.";
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "register", 8, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const platform = await getPlatformConfig();
  if (!platform.allowRegistration) return jsonError("New registrations are temporarily paused", 503);

  const turnstile = await verifyTurnstileToken((body as { turnstileToken?: unknown } | null)?.turnstileToken, request);
  if (!turnstile.ok) {
    return jsonError(turnstile.message, 400);
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(registrationErrorMessage(parsed.error.issues), 400);
  }

  const email = parsed.data.email.toLowerCase();
  const username = parsed.data.username.toLowerCase();
  const phone = formatGhanaPhone(parsed.data.phone);
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }, { username }] } });

  if (existing) {
    return jsonError("An account already exists with this email, username, or phone number", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      username,
      passwordHash,
      role: parsed.data.role,
      phone,
      whatsapp: phone,
      location: parsed.data.location,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
      store:
        parsed.data.role === "SELLER"
          ? {
              create: {
                name: `${parsed.data.name}'s Store`,
                slug: uniqueSlug(slugify(parsed.data.name || "seller-store")),
                kind: parsed.data.storeKind === "FOOD" ? "FOOD" : "GENERAL",
                phone,
                whatsapp: phone,
                momoNumber: parsed.data.storeKind === "FOOD" ? phone : null,
                location: parsed.data.location,
                description: parsed.data.storeKind === "FOOD" ? "New food seller on ShopLinkk." : "New seller on ShopLinkk.",
              },
            }
          : undefined,
      riderProfile:
        parsed.data.role === "RIDER"
          ? {
              create: {
                status: "DRAFT",
                availability: "OFFLINE",
              },
            }
          : undefined,
    },
  });

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: `email-verify:${email}`,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  try {
    const verifyUrl = appUrl(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
    const emailContent = brandedEmail({
      title: "Welcome to ShopLinkk",
      intro: "Your account is ready. Verify your email to improve account trust and keep your marketplace account secure.",
      ctaLabel: "Verify email",
      ctaUrl: verifyUrl,
    });
    await sendEmail({
      to: email,
      subject: "Welcome to ShopLinkk",
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch {
    // The account is valid even if the welcome provider is temporarily unavailable.
  }

  const loginGuard = platform.requireEmailVerification ? "" : await createLoginGuard(email);
  return NextResponse.json({ id: user.id, role: user.role, requiresVerification: platform.requireEmailVerification, loginGuard }, { status: 201 });
}
