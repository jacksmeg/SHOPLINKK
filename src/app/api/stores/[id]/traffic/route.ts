import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { getCurrentSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

const eventSchema = z.object({ event: z.enum(["visits", "whatsappClicks"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return jsonError("Invalid request origin.", 403);
  const limited = enforceRateLimit(request, "store-traffic", 120);
  if (limited) return limited;

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid store event.");
  const { id: storeId } = await params;
  const [store, session] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } }),
    getCurrentSession(),
  ]);
  if (!store || store.ownerId === session?.user.id) return new NextResponse(null, { status: 204 });

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const { event } = parsed.data;
  await prisma.storeTrafficDaily.upsert({
    where: { storeId_day: { storeId, day } },
    create: { storeId, day, [event]: 1 },
    update: { [event]: { increment: 1 } },
  });
  return new NextResponse(null, { status: 204 });
}
