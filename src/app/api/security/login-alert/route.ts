import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, requireApiSession } from "@/lib/api";
import { sendLoginAlert } from "@/lib/security";

const schema = z.object({
  userAgent: z.string().max(500).optional(),
  platform: z.string().max(120).optional(),
  connection: z.string().max(60).optional(),
  timezone: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "security:login-alert", 4, 60_000);
  if (limited) return limited;
  const { session, error } = await requireApiSession();
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  const result = await sendLoginAlert(session.user.id, request, parsed.success ? parsed.data : {});
  return NextResponse.json({ ok: true, ...result });
}
