import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { emailVerificationRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "email:verify", 4, 60 * 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = emailVerificationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user) return jsonError("Account not found", 404);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return jsonError("Another ShopLinkk account already uses this email address", 409);
  }

  if (user.email === email && user.emailVerified) {
    return NextResponse.json({ ok: true, message: "This email address is already verified." });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { email, emailVerified: null },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: `email-verify:${email}` } }),
  ]);

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: `email-verify:${email}`,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Verify your ShopLinkk email",
      text: `Verify your email: ${appUrl(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`)}`,
      html: `<p>Verify your ShopLinkk email address by <a href="${appUrl(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`)}">opening this link</a>.</p>`,
    });
  } catch {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { email: user.email, emailVerified: user.emailVerified },
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: `email-verify:${email}` } }),
    ]);
    return jsonError("We could not send the verification email. Please try again shortly.", 502);
  }

  return NextResponse.json({ ok: true, message: "Verification email sent. Open the link in your inbox to finish." });
}
