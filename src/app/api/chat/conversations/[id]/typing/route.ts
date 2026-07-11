import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { typingStatusSchema } from "@/lib/validators";
import { triggerConversationEvent } from "@/lib/realtime";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = typingStatusSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid typing status");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    select: { id: true },
  });

  if (!conversation) {
    return jsonError("Conversation not found", 404);
  }

  await prisma.chatTypingStatus.upsert({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: session.user.id,
      },
    },
    update: { isTyping: parsed.data.isTyping },
    create: {
      conversationId: id,
      userId: session.user.id,
      isTyping: parsed.data.isTyping,
    },
  });

  await triggerConversationEvent(id, "chat:typing", {
    userId: session.user.id,
    name: session.user.name ?? "Someone",
    isTyping: parsed.data.isTyping,
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
