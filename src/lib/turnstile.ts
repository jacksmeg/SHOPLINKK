import { randomUUID } from "node:crypto";
import { getIntegrationConfig } from "@/lib/integration-settings";

type TurnstileResponse = {
  success?: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function getTurnstileSiteKey() {
  const config = await getIntegrationConfig("CLOUDFLARE_TURNSTILE");
  return config.enabled && config.configured ? config.values.siteKey : "";
}

function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

export async function verifyTurnstileToken(token: unknown, request: Request) {
  const config = await getIntegrationConfig("CLOUDFLARE_TURNSTILE");
  if (!config.enabled || !config.configured) {
    return { ok: true, skipped: true, message: "Cloudflare Turnstile is not enabled." };
  }

  const responseToken = typeof token === "string" ? token.trim() : "";
  if (!responseToken) {
    return { ok: false, skipped: false, message: "Complete the Cloudflare security check before continuing." };
  }

  const body = new URLSearchParams({
    secret: config.values.secretKey,
    response: responseToken,
    idempotency_key: randomUUID(),
  });
  const ip = requestIp(request);
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as TurnstileResponse | null;

    if (response.ok && result?.success) {
      return { ok: true, skipped: false, message: "Cloudflare security check passed." };
    }

    const codes = result?.["error-codes"]?.join(", ");
    const duplicate = result?.["error-codes"]?.includes("timeout-or-duplicate");
    return {
      ok: false,
      skipped: false,
      message: duplicate
        ? "The Cloudflare security check expired. Refresh the check and try again."
        : codes
          ? `Cloudflare security check failed: ${codes}.`
          : "Cloudflare security check failed. Please try again.",
    };
  } catch {
    return { ok: false, skipped: false, message: "Cloudflare could not verify this request right now. Try again." };
  }
}
