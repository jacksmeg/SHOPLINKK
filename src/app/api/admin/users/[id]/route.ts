import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  if (id === session.user.id) {
    return jsonError("Admins cannot delete their own active account.", 409);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) return jsonError("User not found.", 404);

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true, deleted: true });
}
