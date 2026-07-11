import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("town"),
    name: z.string().min(2),
    region: z.string().min(2),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }),
  z.object({ action: z.literal("area"), townId: z.string().min(1), name: z.string().min(2) }),
]);

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]); if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid town details");
  if (parsed.data.action === "town") {
    const count = await prisma.town.count();
    const town = await prisma.town.create({ data: { name: parsed.data.name, slug: slugify(parsed.data.name), region: parsed.data.region, latitude: parsed.data.latitude, longitude: parsed.data.longitude, sortOrder: count } });
    await prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "TOWN_CREATED", targetType: "Town", targetId: town.id } });
    return NextResponse.json(town, { status: 201 });
  }
  const count = await prisma.townArea.count({ where: { townId: parsed.data.townId } });
  const area = await prisma.townArea.create({ data: { townId: parsed.data.townId, name: parsed.data.name, slug: slugify(parsed.data.name), sortOrder: count } });
  await prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "TOWN_UPDATED", targetType: "Town", targetId: parsed.data.townId, metadata: { areaId: area.id } } });
  return NextResponse.json(area, { status: 201 });
}
