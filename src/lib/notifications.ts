import type { AuditAction, NotificationType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { sendSmsAlert } from "@/lib/sms";
import { deliverPushToUser } from "@/lib/web-push";

export async function notifyUser(input: {
  userId: string;
  type?: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "SYSTEM",
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
}

export async function notifySellerOrderAlert(input: {
  sellerId: string;
  title: string;
  body: string;
  href?: string;
  buyerName?: string | null;
  storeName?: string | null;
  amount?: number | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.sellerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailAlertsEnabled: true,
      pushNotificationsEnabled: true,
    },
  });

  if (!user) return null;

  const href = input.href || "/seller/orders";
  const openUrl = appUrl(href);
  const smsBody = `${input.title}: ${input.body}`.slice(0, 150);
  const amountLine = typeof input.amount === "number" ? `<p><strong>Amount:</strong> GHS ${input.amount.toFixed(2)}</p>` : "";

  const tasks: Array<Promise<unknown>> = [
    notifyUser({
      userId: input.sellerId,
      type: "SYSTEM",
      title: input.title,
      body: input.body,
      href,
    }),
  ];

  if (user.pushNotificationsEnabled) {
    tasks.push(
      deliverPushToUser(input.sellerId, {
        title: input.title,
        body: input.body,
        href,
        tag: "seller-order-alert",
      }),
    );
  }

  if (user.email && user.emailAlertsEnabled) {
    tasks.push(
      sendEmail({
        to: user.email,
        subject: input.title,
        text: `${input.body}\n\nOpen ShopLinkk: ${openUrl}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f6f8fc;padding:24px;color:#071b3a">
            <div style="max-width:560px;margin:auto;background:white;border:1px solid #d8e0ef;border-radius:14px;padding:24px">
              <h1 style="font-size:20px;margin:0 0 10px">ShopLinkk order alert</h1>
              <p style="font-size:14px;line-height:1.6">${input.body}</p>
              ${amountLine}
              <p style="font-size:13px;line-height:1.6"><strong>Buyer:</strong> ${input.buyerName || "Buyer"}</p>
              <p style="font-size:13px;line-height:1.6"><strong>Store:</strong> ${input.storeName || "Your store"}</p>
              <a href="${openUrl}" style="display:inline-block;margin-top:14px;background:#071b3a;color:white;text-decoration:none;border-radius:8px;padding:12px 16px;font-size:13px;font-weight:700">Open seller orders</a>
            </div>
          </div>
        `,
      }),
    );
  }

  if (user.phone) {
    tasks.push(sendSmsAlert(user.phone, smsBody));
  }

  await Promise.allSettled(tasks);
  return { ok: true };
}

export async function auditLog(input: {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    },
  });
}
