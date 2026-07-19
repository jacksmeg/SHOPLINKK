import { getIntegrationConfig } from "@/lib/integration-settings";

type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
  environment: string;
  release: string;
  service: "shoplinkk";
};

async function sendLog(payload: LogPayload) {
  try {
    const monitoring = await getIntegrationConfig("MONITORING");
    const webhook = monitoring.enabled ? monitoring.values.webhookUrl : "";
    if (!webhook) {
      return;
    }

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Console logs remain available even when the external monitor is down.
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  const payload = basePayload("info", message, context);
  console.info("[shoplinkk]", payload);
  void sendLog(payload);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  const payload = basePayload("warn", message, context);
  console.warn("[shoplinkk]", payload);
  void sendLog(payload);
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>) {
  const payload = basePayload("error", message, {
    ...context,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  });
  console.error("[shoplinkk]", payload);
  void sendLog(payload);
}

function basePayload(level: LogLevel, message: string, context?: Record<string, unknown>): LogPayload {
  return {
    level,
    message,
    context: scrubSensitiveContext(context),
    createdAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    release: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || "local",
    service: "shoplinkk",
  };
}

function scrubSensitiveContext(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  return scrubObject(value as Record<string, unknown>);
}

function scrubObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (/(password|secret|token|key|authorization|cookie|credential)/i.test(key)) {
        return [key, "[redacted]"];
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        return [key, scrubObject(item as Record<string, unknown>)];
      }

      return [key, item];
    }),
  );
}
