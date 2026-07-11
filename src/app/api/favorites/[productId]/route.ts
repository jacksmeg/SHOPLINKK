import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { productId } = await context.params;
  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      productId,
    },
  });

  return NextResponse.json({ ok: true });
}
