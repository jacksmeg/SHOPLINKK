import { prisma } from "@/lib/db";

const startedAt = Date.now();

const requiredProductionEnv = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "INTEGRATION_ENCRYPTION_KEY",
];

export async function buildReadinessReport() {
  const database = await checkDatabase();
  const env = checkRequiredEnvironment();
  const ok = database.ok && env.ok;

  return {
    status: ok ? 200 : 503,
    body: {
      ok,
      service: "shoplinkk",
      state: ok ? "ready" : "degraded",
      checks: { database, environment: env },
      runtime: runtimeReport(),
      checkedAt: new Date().toISOString(),
    },
  };
}

export function buildLivenessReport() {
  return {
    ok: true,
    service: "shoplinkk",
    state: "live",
    runtime: runtimeReport(),
    checkedAt: new Date().toISOString(),
  };
}

async function checkDatabase() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}

function checkRequiredEnvironment() {
  const missing = requiredProductionEnv.filter((key) => !process.env[key]);
  return {
    ok: missing.length === 0,
    missingCount: missing.length,
    missing: process.env.NODE_ENV === "production" ? undefined : missing,
  };
}

function runtimeReport() {
  return {
    environment: process.env.NODE_ENV || "development",
    release: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || "local",
    region: process.env.RENDER_REGION || process.env.VERCEL_REGION || "local",
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  };
}
