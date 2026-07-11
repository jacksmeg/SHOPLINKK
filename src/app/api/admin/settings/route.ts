import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { savePlatformConfig } from "@/lib/platform-settings";
import { getIntegrationConfig } from "@/lib/integration-settings";

const schema = z.object({
  brandName: z.string().min(2).max(40),
  logoUrl: z.union([z.url(), z.string().regex(/^\/(brand|uploads)\/.+/)]),
  supportEmail: z.email(), supportPhone: z.string().min(7), defaultTown: z.string().min(2),
  listingApproval: z.boolean(), allowRegistration: z.boolean(), requireEmailVerification: z.boolean(), requirePhoneVerification: z.boolean(), maintenanceMode: z.boolean(),
  safetyBanner: z.string().min(10).max(240), listingExpiryDays: z.number().int().min(7).max(365), maxProductImages: z.number().int().min(1).max(12),
});

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]); if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid platform settings");
  if (parsed.data.requireEmailVerification && !(await getIntegrationConfig("RESEND")).enabled) return jsonError("Connect and enable Resend before requiring email verification");
  if (parsed.data.requirePhoneVerification && !(await getIntegrationConfig("ARKESEL")).enabled) return jsonError("Connect and enable Arkesel OTP before requiring phone verification");
  const saved = await savePlatformConfig(parsed.data, session.user.id);
  await prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "PLATFORM_SETTINGS_UPDATED", targetType: "PlatformSetting", targetId: saved.id } });
  return NextResponse.json({ ok: true });
}
