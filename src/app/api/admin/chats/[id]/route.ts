import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const conversation = await prisma.conversation.findUnique({ where: { id }, select: { id: true } });
  if (!conversation) return jsonError("Conversation not found.", 404);

  await prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
