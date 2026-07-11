import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/email-template";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", 6, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (parsed.success) {
    try {
      const email = parsed.data.email.toLowerCase();
      const token = randomUUID();
      await prisma.verificationToken.create({
        data: {
          identifier: `password-reset:${email}`,
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
    } catch {
      // Keep response generic so account existence is not exposed.
    }
  }

  return NextResponse.json({
    message:
      "If the email exists, reset instructions will be sent.",
  });
}
