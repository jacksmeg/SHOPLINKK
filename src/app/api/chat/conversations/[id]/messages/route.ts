import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";
import { triggerConversationEvent } from "@/lib/realtime";
import { deliverPushToUser } from "@/lib/web-push";
import { messageSchema } from "@/lib/validators";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

async function getConversationForUser(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, session.user.id);

  if (!conversation) {
    return jsonError("Conversation not found", 404);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const readResult = await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  if (readResult.count) {
    await triggerConversationEvent(id, "chat:read", { readerId: session.user.id }).catch(() => null);
  }

  return NextResponse.json({ conversation, messages });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = enforceRateLimit(request, "chat:send", 60, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, session.user.id);

  if (!conversation) {
    return jsonError("Conversation not found", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid message");
  }

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      active: true,
      OR: [
        { blockedById: conversation.buyerId, targetId: conversation.sellerId },
        { blockedById: conversation.sellerId, targetId: conversation.buyerId },
      ],
    },
  });

  if (blocked) {
    return jsonError("This conversation is blocked", 403);
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      body: parsed.data.body,
      attachments: parsed.data.attachments?.length
        ? {
            create: parsed.data.attachments.map((attachment) => ({
              uploaderId: session.user.id,
              url: attachment.url,
              type: attachment.type,
              name: attachment.name,
              size: attachment.size,
            })),
          }
        : undefined,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      attachments: true,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  const recipientId = conversation.buyerId === session.user.id ? conversation.sellerId : conversation.buyerId;
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, emailAlertsEnabled: true },
  });
  await Promise.all([
    notifyUser({
      userId: recipientId,
      type: "MESSAGE",
      title: "New message",
      body: parsed.data.body.slice(0, 120),
      href: `/chat/${id}`,
    }),
    deliverPushToUser(recipientId, {
      title: `New message about ${conversation.product.title}`,
      body: parsed.data.body.slice(0, 120),
      href: `/chat/${id}`,
      tag: `shoplinkk-chat-${id}`,
    }).catch(() => null),
    recipient?.email && recipient.emailAlertsEnabled
      ? sendEmail({
          to: recipient.email,
          subject: "New ShopLinkk message",
          html: `<p>You have a new message about ${escapeHtml(conversation.product.title)}.</p><p>${escapeHtml(parsed.data.body.slice(0, 200))}</p><p><a href="${appUrl(`/chat/${id}`)}">Open chat</a></p>`,
        }).catch(() => null)
      : Promise.resolve(),
    triggerConversationEvent(id, "chat:message", { messageId: message.id }).catch(() => null),
  ]);

  return NextResponse.json(message, { status: 201 });
}
