import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const folders = await prisma.favoriteFolder.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { favorites: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(folders);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2) {
    return jsonError("Folder name is required");
  }

  const folder = await prisma.favoriteFolder.upsert({
    where: { userId_name: { userId: session.user.id, name } },
    update: {},
    create: { userId: session.user.id, name },
  });

  return NextResponse.json(folder, { status: 201 });
}

