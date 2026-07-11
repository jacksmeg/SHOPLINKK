import { createHash, createHmac } from "node:crypto";
import { getIntegrationConfig } from "@/lib/integration-settings";

type PusherCredentials = {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
};

export function conversationChannel(conversationId: string) {
  return `private-conversation-${conversationId}`;
}

async function getPusherCredentials(): Promise<PusherCredentials | null> {
  const integration = await getIntegrationConfig("PUSHER");
  if (!integration.enabled) return null;

  const { appId, key, secret, cluster } = integration.values;
  if (!appId || !key || !secret || !cluster) return null;
  return { appId, key, secret, cluster };
}

export async function getPublicRealtimeConfig() {
  const credentials = await getPusherCredentials();
  return credentials
    ? { enabled: true, key: credentials.key, cluster: credentials.cluster }
    : { enabled: false as const };
}

export async function authorizePrivateChannel({ socketId, channelName }: { socketId: string; channelName: string }) {
  const credentials = await getPusherCredentials();
  if (!credentials) throw new Error("Pusher realtime is not configured");

  const signature = createHmac("sha256", credentials.secret)
    .update(`${socketId}:${channelName}`)
    .digest("hex");

  return { auth: `${credentials.key}:${signature}` };
}

export async function triggerConversationEvent(conversationId: string, event: string, payload: Record<string, unknown>) {
  return triggerPusherEvent(conversationChannel(conversationId), event, payload);
}

export async function sendRealtimeConnectionTest() {
  return triggerPusherEvent("shoplinkk-admin-test", "connection:test", {
    sentAt: new Date().toISOString(),
    source: "ShopLinkk",
  });
}

async function triggerPusherEvent(channel: string, event: string, payload: Record<string, unknown>) {
  const credentials = await getPusherCredentials();
  if (!credentials) return false;

  const requestBody = JSON.stringify({
    name: event,
    channels: [channel],
    data: JSON.stringify(payload),
  });
  const path = `/apps/${credentials.appId}/events`;
  const parameters = new URLSearchParams({
    auth_key: credentials.key,
    auth_timestamp: String(Math.floor(Date.now() / 1000)),
    auth_version: "1.0",
    body_md5: createHash("md5").update(requestBody).digest("hex"),
  });
  const stringToSign = `POST\n${path}\n${parameters.toString()}`;
  const signature = createHmac("sha256", credentials.secret).update(stringToSign).digest("hex");
  parameters.set("auth_signature", signature);

  const response = await fetch(`https://api-${credentials.cluster}.pusher.com${path}?${parameters.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  if (!response.ok) {
    throw new Error(`Pusher rejected the event (${response.status})`);
  }

  return true;
}
