import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { formatGhanaPhone } from "@/lib/ghana";
import { createOtp, isPhoneOtpProviderEnabled, sendOtp } from "@/lib/sms";
import { ghanaPhoneSchema } from "@/lib/validators";
import { z } from "zod";

const schema = z.object({ phone: ghanaPhoneSchema });

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "signup-phone", 5, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a valid Ghana phone number");

  const phone = formatGhanaPhone(parsed.data.phone);
  const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return jsonError("An account already exists with this phone number.", 409);

  const code = createOtp();
  const providerEnabled = await isPhoneOtpProviderEnabled();

  if (!providerEnabled) {
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: `signup-phone:${phone}` } }),
      prisma.verificationToken.deleteMany({ where: { identifier: `signup-phone-proof:${phone}` } }),
      prisma.verificationToken.create({
        data: {
          identifier: `signup-phone:${phone}`,
          token: `${code}-${randomUUID()}`,
          expires: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);
  } else {
    await prisma.verificationToken.deleteMany({ where: { identifier: `signup-phone-proof:${phone}` } });
  }

  try {
    await sendOtp(phone, code);
  } catch {
    return jsonError("We could not send the SMS code. Check the number and try again.", 502);
  }

  return NextResponse.json({ ok: true, message: "Phone OTP sent by SMS." });
}
