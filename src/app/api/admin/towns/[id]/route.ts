import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]); if (error) return error;
  const parsed = z.object({ isActive: z.boolean().optional(), latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional() }).refine((value) => Object.keys(value).length > 0).safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError("Invalid town details");
  const town = await prisma.town.update({ where: { id: (await context.params).id }, data: parsed.data });
  await prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "TOWN_UPDATED", targetType: "Town", targetId: town.id, metadata: parsed.data } });
  return NextResponse.json(town);
}
