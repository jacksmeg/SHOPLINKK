type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
};

async function sendLog(payload: LogPayload) {
  const monitoring = await getIntegrationConfig("MONITORING");
  const webhook = monitoring.enabled ? monitoring.values.webhookUrl : "";
  if (!webhook) {
    return;
  }

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  const payload = { level: "info" as const, message, context, createdAt: new Date().toISOString() };
  console.info("[shoplinkk]", payload);
  void sendLog(payload);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  const payload = { level: "warn" as const, message, context, createdAt: new Date().toISOString() };
  console.warn("[shoplinkk]", payload);
  void sendLog(payload);
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>) {
  const payload = {
    level: "error" as const,
    message,
    context: {
      ...context,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    },
    createdAt: new Date().toISOString(),
  };
  console.error("[shoplinkk]", payload);
  void sendLog(payload);
}
import { getIntegrationConfig } from "@/lib/integration-settings";
