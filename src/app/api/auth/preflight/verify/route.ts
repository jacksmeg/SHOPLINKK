import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { formatGhanaPhone } from "@/lib/ghana";
import { verifyOtp } from "@/lib/sms";
import { ghanaPhoneSchema } from "@/lib/validators";
import { z } from "zod";

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.email("Enter a valid email address"),
    code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit email code"),
  }),
  z.object({
    type: z.literal("phone"),
    phone: ghanaPhoneSchema,
    code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit SMS code"),
  }),
]);

async function createProof(identifier: string) {
  const proofToken = randomUUID();
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: proofToken,
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    }),
  ]);
  return proofToken;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "signup-verify", 12, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter the verification code");

  if (parsed.data.type === "email") {
    const email = parsed.data.email.toLowerCase();
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: `signup-email:${email}`,
        token: { startsWith: `${parsed.data.code}-` },
        expires: { gt: new Date() },
      },
    });
    if (!token) return jsonError("Email code is invalid or expired.", 400);

    const proofToken = await createProof(`signup-email-proof:${email}`);
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
    return NextResponse.json({ ok: true, proofToken, message: "Email verified." });
  }

  const phone = formatGhanaPhone(parsed.data.phone);
  const providerVerified = await verifyOtp(phone, parsed.data.code);
  const token =
    providerVerified === null
      ? await prisma.verificationToken.findFirst({
          where: {
            identifier: `signup-phone:${phone}`,
            token: { startsWith: `${parsed.data.code}-` },
            expires: { gt: new Date() },
          },
        })
      : null;

  if (providerVerified === false || (providerVerified === null && !token)) {
    return jsonError("Phone code is invalid or expired.", 400);
  }

  const proofToken = await createProof(`signup-phone-proof:${phone}`);
  if (token) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
  }

  return NextResponse.json({ ok: true, proofToken, message: "Phone verified." });
}
