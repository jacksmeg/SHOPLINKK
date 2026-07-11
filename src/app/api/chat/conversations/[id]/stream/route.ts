import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
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

  const stream = new ReadableStream({
    async start(controller) {
      for (let tick = 0; tick < 30; tick += 1) {
        if (request.signal.aborted) {
          break;
        }

        const [latestMessage, messageCount, typingUsers] = await Promise.all([
          prisma.message.findFirst({
            where: { conversationId: id },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          }),
          prisma.message.count({ where: { conversationId: id } }),
          prisma.chatTypingStatus.findMany({
            where: {
              conversationId: id,
              userId: { not: session.user.id },
              isTyping: true,
              updatedAt: { gt: new Date(Date.now() - 6000) },
            },
            include: { user: { select: { name: true } } },
          }),
        ]);

        controller.enqueue(
          sse("refresh", {
            latestMessageId: latestMessage?.id ?? null,
            latestMessageAt: latestMessage?.createdAt ?? null,
            messageCount,
            typingNames: typingUsers.map((item) => item.user.name ?? "Someone"),
          }),
        );

        await wait(2000, request.signal);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
