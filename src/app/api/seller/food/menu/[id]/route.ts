import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  isAvailable: z.coerce.boolean(),
});

async function ownedItem(itemId: string, userId: string, role: string) {
  return prisma.foodMenuItem.findFirst({
    where: {
      id: itemId,
      store: role === "ADMIN" ? undefined : { ownerId: userId },
    },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;
  const { id } = await context.params;
  const item = await ownedItem(id, session.user.id, session.user.role);
  if (!item) return jsonError("Food item not found.", 404);

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose the food availability status.");
  const updated = await prisma.foodMenuItem.update({ where: { id }, data: { isAvailable: parsed.data.isAvailable } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;
  const { id } = await context.params;
  const item = await ownedItem(id, session.user.id, session.user.role);
  if (!item) return jsonError("Food item not found.", 404);
  await prisma.foodMenuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
