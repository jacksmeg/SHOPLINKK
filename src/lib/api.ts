import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";
import { getAuthOptions } from "@/lib/auth";
import { rateLimit, requestKey } from "@/lib/rate-limit";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function withRateLimitHeaders(response: NextResponse, result: ReturnType<typeof rateLimit>) {
  response.headers.set("RateLimit-Limit", String(result.limit));
  response.headers.set("RateLimit-Remaining", String(result.remaining));
  response.headers.set("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) response.headers.set("Retry-After", String(result.retryAfter));
  return response;
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
    return withRateLimitHeaders(jsonError("Too many requests. Please try again shortly.", 429), result);
  }

  return null;
}
