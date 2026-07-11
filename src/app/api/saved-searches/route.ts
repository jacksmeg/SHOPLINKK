import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { savedSearchSchema } from "@/lib/validators";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(searches);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = savedSearchSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid saved search");
  }

  const search = await prisma.savedSearch.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      query: parsed.data.query,
      category: parsed.data.category,
      location: parsed.data.location,
      minPrice: parsed.data.minPrice,
      maxPrice: parsed.data.maxPrice,
      alertsEnabled: parsed.data.alertsEnabled,
    },
  });

  return NextResponse.json(search, { status: 201 });
}

