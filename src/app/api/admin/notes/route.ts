import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { auditLog } from "@/lib/notifications";
import { adminNoteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = adminNoteSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid note");
  }

  const note = await prisma.adminNote.create({
    data: {
      authorId: session.user.id,
      targetUserId: parsed.data.targetUserId,
      productId: parsed.data.productId,
      body: parsed.data.body,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action: "ADMIN_NOTE_CREATED",
    targetType: parsed.data.productId ? "Product" : "User",
    targetId: parsed.data.productId ?? parsed.data.targetUserId,
  });

  return NextResponse.json(note, { status: 201 });
}

