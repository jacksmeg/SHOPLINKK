import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, ownerId: true },
  });

  if (!store) return jsonError("Store not found", 404);
  if (store.ownerId === session.user.id) return jsonError("You cannot follow your own store.", 409);

  const existing = await prisma.storeFollower.findUnique({
    where: { userId_storeId: { userId: session.user.id, storeId: store.id } },
    select: { id: true, createdAt: true },
  });

  const follow = existing ?? await prisma.storeFollower.create({
    data: { userId: session.user.id, storeId: store.id },
  });

  const followerCount = await prisma.storeFollower.count({ where: { storeId: store.id } });

  if (!existing) {
    await notifyUser({
      userId: store.ownerId,
      title: "New store follower",
      body: `${session.user.name || "A buyer"} followed ${store.name}.`,
      href: "/seller",
    }).catch(() => null);
  }

  return NextResponse.json({ following: true, followerCount, followedAt: follow.createdAt });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  await prisma.storeFollower.deleteMany({
    where: { userId: session.user.id, storeId: id },
  });

  const followerCount = await prisma.storeFollower.count({ where: { storeId: id } });

  return NextResponse.json({ following: false, followerCount });
}
