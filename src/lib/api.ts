import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";
import { getAuthOptions } from "@/lib/auth";
import { rateLimit, requestKey } from "@/lib/rate-limit";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function requireApiSession(roles?: Role[]) {
  const session = await getServerSession(await getAuthOptions());

  if (!session?.user?.id) {
    return {
      session: null,
      error: jsonError("Authentication required", 401),
    };
  }

  if (roles && !roles.includes(session.user.role)) {
    return {
      session: null,
      error: jsonError("You do not have permission to perform this action", 403),
    };
  }

  return { session, error: null };
}

export function enforceRateLimit(request: Request, scope: string, limit = 60, windowMs = 60_000) {
  const result = rateLimit(requestKey(request, scope), limit, windowMs);

  if (!result.allowed) {
    return jsonError("Too many requests. Please try again shortly.", 429);
  }

  return null;
}
