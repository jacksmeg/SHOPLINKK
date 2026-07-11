import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { profileSchema } from "@/lib/validators";
import { formatGhanaPhone } from "@/lib/ghana";

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile data");
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...parsed.data,
      phone: formatGhanaPhone(parsed.data.phone),
      whatsapp: parsed.data.whatsapp ? formatGhanaPhone(parsed.data.whatsapp) : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      location: true,
      area: true,
      image: true,
      bio: true,
      role: true,
    },
  });

  return NextResponse.json(user);
}
