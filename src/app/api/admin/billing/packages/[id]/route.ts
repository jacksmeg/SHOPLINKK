import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { billingPackageSchema } from "@/lib/validators";

function emptyToNull<T>(value: T | "") {
  return value === "" ? null : value;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const parsed = billingPackageSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid package data");
  const { id } = await context.params;
  const data = parsed.data;

  const item = await prisma.billingPackage.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.durationDays !== undefined ? { durationDays: emptyToNull(data.durationDays) } : {}),
      ...(data.listingCount !== undefined ? { listingCount: emptyToNull(data.listingCount) } : {}),
      ...(data.placement !== undefined ? { placement: emptyToNull(data.placement) } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      updatedById: session.user.id,
    },
  });

  return NextResponse.json({ ...item, price: Number(item.price) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const { id } = await context.params;
  const item = await prisma.billingPackage.update({
    where: { id },
    data: { isActive: false, updatedById: session.user.id },
  });
  return NextResponse.json({ ...item, price: Number(item.price) });
}
