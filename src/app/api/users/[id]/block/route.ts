import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  if (id === session.user.id) {
    return jsonError("You cannot block yourself");
  }

  const body = await request.json().catch(() => null);
  const active = body?.active !== false;

  const block = await prisma.blockedUser.upsert({
    where: {
      blockedById_targetId: {
        blockedById: session.user.id,
        targetId: id,
      },
    },
    update: {
      active,
      reason: body?.reason ?? "User blocked",
    },
    create: {
      blockedById: session.user.id,
      targetId: id,
      active,
      reason: body?.reason ?? "User blocked",
    },
  });

  return NextResponse.json(block);
}

