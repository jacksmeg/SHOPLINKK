import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api";

export async function GET(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const sinceValue = new URL(request.url).searchParams.get("since");
  const since = sinceValue ? new Date(sinceValue) : null;

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: since ? 20 : 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
