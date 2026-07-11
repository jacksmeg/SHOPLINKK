import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { authorizePrivateChannel, conversationChannel } from "@/lib/realtime";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "realtime:authorize", 80, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError("Invalid realtime authorization request", 403);
  }

  const form = await request.formData();
  const socketId = form.get("socket_id");
  const channelName = form.get("channel_name");
  const prefix = "private-conversation-";
  if (typeof socketId !== "string" || typeof channelName !== "string" || !channelName.startsWith(prefix)) {
    return jsonError("Invalid realtime channel", 400);
  }

  const conversationId = channelName.slice(prefix.length);
  if (channelName !== conversationChannel(conversationId)) {
    return jsonError("Invalid realtime channel", 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    select: { id: true },
  });
  if (!conversation) return jsonError("Conversation not found", 404);

  try {
    return NextResponse.json(await authorizePrivateChannel({ socketId, channelName }));
  } catch {
    return jsonError("Realtime service is not available", 503);
  }
}
