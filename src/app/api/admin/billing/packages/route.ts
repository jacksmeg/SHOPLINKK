import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { billingPackageSchema } from "@/lib/validators";

function emptyToNull<T>(value: T | "") {
  return value === "" ? null : value;
}

export async function GET() {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const packages = await prisma.billingPackage.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { price: "asc" }],
    include: { _count: { select: { payments: true } } },
  });
  return NextResponse.json(packages.map((item) => ({ ...item, price: Number(item.price) })));
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const parsed = billingPackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid package data");

  const item = await prisma.billingPackage.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      price: parsed.data.price,
      currency: parsed.data.currency,
      durationDays: emptyToNull(parsed.data.durationDays),
      listingCount: emptyToNull(parsed.data.listingCount),
      placement: emptyToNull(parsed.data.placement),
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
      updatedById: session.user.id,
    },
  });

  return NextResponse.json({ ...item, price: Number(item.price) }, { status: 201 });
}
