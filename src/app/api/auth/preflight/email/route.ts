import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/email-template";
import { z } from "zod";

const schema = z.object({ email: z.email("Enter a valid email address") });

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "signup-email", 5, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a valid email address");

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return jsonError("An account already exists with this email address.", 409);

  const code = createCode();
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: `signup-email:${email}` } }),
    prisma.verificationToken.deleteMany({ where: { identifier: `signup-email-proof:${email}` } }),
    prisma.verificationToken.create({
      data: {
        identifier: `signup-email:${email}`,
        token: `${code}-${randomUUID()}`,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    }),
  ]);

  const emailContent = brandedEmail({
    title: "Verify your ShopLinkk email",
    intro: "Use this code to continue creating your ShopLinkk account.",
    body: `Your email verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
    ctaLabel: "Open ShopLinkk",
    ctaUrl: appUrl("/register"),
  });

  try {
    await sendEmail({
      to: email,
      subject: "Your ShopLinkk email verification code",
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch {
    return jsonError("We could not send the email code. Check the address and try again.", 502);
  }

  return NextResponse.json({ ok: true, message: "Email code sent. Check your inbox." });
}
