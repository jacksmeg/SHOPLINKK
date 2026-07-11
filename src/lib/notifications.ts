import type { AuditAction, NotificationType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

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
