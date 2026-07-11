import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { jsonError, requireApiSession } from "@/lib/api";

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
});

export async function POST(request: Request) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = staffSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid staff account");
  }

  const user = await prisma.user.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { role: "ADMIN", name: parsed.data.name },
    create: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: "ADMIN",
      emailVerified: new Date(),
      location: "Dunkwa-on-Offin",
    },
  });

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${user.email}`,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await sendEmail({
    to: user.email ?? parsed.data.email,
    subject: "Your ShopLinkk staff account",
    html: `<p>Hello ${user.name ?? "there"},</p><p>Your ShopLinkk staff account is ready. Set a secure password here:</p><p><a href="${appUrl()}/reset-password?email=${encodeURIComponent(user.email ?? parsed.data.email)}&token=${token}">Set password</a></p>`,
  });

  return NextResponse.json({ ok: true, id: user.id });
}

