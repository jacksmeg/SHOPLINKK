import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(10).max(100),
  }),
  userAgent: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "push:subscribe", 10, 60_000);
  if (limited) return limited;
  const { session, error } = await requireApiSession();
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("The device notification subscription is invalid.");
  if (!parsed.data.endpoint.startsWith("https://")) return jsonError("Device notifications require a secure HTTPS subscription.");

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: session.user.id, endpoint: parsed.data.endpoint } },
    update: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent: parsed.data.userAgent ?? null },
    create: { userId: session.user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent: parsed.data.userAgent ?? null },
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { pushNotificationsEnabled: true } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (!endpoint) return jsonError("Subscription endpoint is required.");
  await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id, endpoint } });
  return NextResponse.json({ ok: true });
}
