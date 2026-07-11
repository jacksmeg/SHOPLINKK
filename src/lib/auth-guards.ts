import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { getAuthOptions } from "@/lib/auth";

export async function getCurrentSession() {
  return getServerSession(await getAuthOptions());
}

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireUser();

  if (!roles.includes(session.user.role)) {
    redirect("/");
  }

  return session;
}
