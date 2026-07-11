import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
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

      await sendEmail({
        to: email,
        subject: "Reset your ShopLinkk password",
        text: `Reset your password: ${appUrl(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`)}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18231f">
            <h2>Reset your password</h2>
            <p>This link expires in 30 minutes.</p>
            <p><a href="${appUrl(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`)}">Reset password</a></p>
          </div>
        `,
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
