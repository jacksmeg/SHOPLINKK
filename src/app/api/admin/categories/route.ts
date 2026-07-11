import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { auditLog } from "@/lib/notifications";
import { slugify } from "@/lib/slug";

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid category");
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      icon: parsed.data.icon,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action: "CATEGORY_CREATED",
    targetType: "Category",
    targetId: category.id,
  });

  return NextResponse.json(category, { status: 201 });
}
