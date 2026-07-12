import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { riderAvailabilitySchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession(["RIDER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = riderAvailabilitySchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a valid rider status");

  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return jsonError("Complete your rider profile first", 404);
  if (profile.status !== "APPROVED") return jsonError("Admin must approve your rider account before going online", 403);

  const updated = await prisma.riderProfile.update({
    where: { id: profile.id },
    data: { availability: parsed.data.availability },
  });

  return NextResponse.json({ profile: updated });
}
