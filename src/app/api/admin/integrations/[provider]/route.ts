import { NextResponse } from "next/server";
import type { IntegrationStatus } from "@/generated/prisma/client";
import { requireApiSession, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { integrationProviders, type IntegrationProviderKey } from "@/lib/integration-definitions";
import { getIntegrationConfig, saveIntegrationSetting, updateIntegrationTest } from "@/lib/integration-settings";
import { sendRealtimeConnectionTest } from "@/lib/realtime";
import { sendOtp } from "@/lib/sms";

function providerKey(value: string): IntegrationProviderKey | null {
  return integrationProviders.includes(value as IntegrationProviderKey) ? value as IntegrationProviderKey : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const provider = providerKey((await context.params).provider);
  if (!provider) return jsonError("Unknown integration", 404);
  const body = await request.json().catch(() => null) as { enabled?: boolean; values?: Record<string, string> } | null;
  if (!body?.values || typeof body.values !== "object") return jsonError("Invalid integration settings");

  const saved = await saveIntegrationSetting({ provider, values: body.values, enabled: Boolean(body.enabled), updatedById: session.user.id });
  await prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "INTEGRATION_UPDATED", targetType: "IntegrationSetting", targetId: saved.id, metadata: { provider, enabled: saved.enabled } } });
  return NextResponse.json({ ok: true, status: saved.status, enabled: saved.enabled });
}

export async function POST(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const provider = providerKey((await context.params).provider);
  if (!provider) return jsonError("Unknown integration", 404);
  const config = await getIntegrationConfig(provider);
  if (!config.configured) {
    await updateIntegrationTest(provider, "ERROR", "Required settings are missing.");
    return jsonError("Add all required settings before testing.");
  }

  let ok = true;
  let message = "Configuration is complete.";
  try {
    if (provider === "RESEND") {
      if (!session?.user.email) {
        ok = false;
        message = "Your admin account needs an email address before Resend can be tested.";
      } else {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.values.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: config.values.from,
            to: [session.user.email],
            subject: "ShopLinkk email connection test",
            text: "Your ShopLinkk Resend connection is working.",
            html: "<p>Your <strong>ShopLinkk</strong> Resend connection is working.</p>",
          }),
        });
        ok = response.ok;
        message = ok
          ? `Test email sent to ${session.user.email}.`
          : "Resend could not send the test email. Check the sender domain and API key.";
      }
    } else if (provider === "ARKESEL") {
      if (!session?.user.phone) {
        ok = false;
        message = "Your admin account needs a Ghana phone number before Arkesel can be tested.";
      } else {
        await sendOtp(session.user.phone, "");
        message = `A real Arkesel test code was sent to ${session.user.phone}.`;
      }
    } else if (provider === "CLOUDINARY") {
      const authorization = `Basic ${Buffer.from(`${config.values.apiKey}:${config.values.apiSecret}`).toString("base64")}`;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${config.values.cloudName}/resources/image/upload?max_results=1`, {
        headers: { Authorization: authorization },
      });
      ok = response.ok;
      message = ok ? "Cloudinary credentials are working. Product and profile uploads are ready." : "Cloudinary rejected the cloud name or API credentials.";
    } else if (provider === "GOOGLE_OAUTH") {
      const response = await fetch("https://accounts.google.com/.well-known/openid-configuration");
      ok = response.ok;
      message = ok ? "Google OAuth is ready for a sign-in test." : "Google OAuth is currently unreachable.";
    } else if (provider === "PUSHER") {
      await sendRealtimeConnectionTest();
      message = "Pusher accepted a realtime connection test. Private chat channels are ready.";
    } else if (provider === "GOOGLE_MAPS") {
      const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      endpoint.searchParams.set("address", "Dunkwa-on-Offin, Ghana");
      endpoint.searchParams.set("key", config.values.apiKey);
      const response = await fetch(endpoint, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { status?: string; error_message?: string } | null;
      ok = response.ok && (result?.status === "OK" || result?.status === "ZERO_RESULTS");
      message = ok
        ? "Google Maps accepted the key. Town maps and nearest-place browsing are ready."
        : result?.error_message || "Google Maps rejected the key. Check API restrictions and enabled APIs.";
    } else if (provider === "PAYSTACK") {
      const response = await fetch("https://api.paystack.co/balance", {
        headers: { Authorization: `Bearer ${config.values.secretKey}` },
        cache: "no-store",
      });
      ok = response.ok;
      message = ok ? "Paystack accepted the secret key. Seller checkout can use Paystack." : "Paystack rejected the secret key.";
    } else if (provider === "KORA") {
      ok = /^https:\/\/.+/i.test(config.values.baseUrl || "") && Boolean(config.values.secretKey);
      message = ok ? "Kora settings are saved and ready for a live checkout test." : "Kora needs a live API base URL and secret key.";
    } else if (provider === "WEB_PUSH") {
      const publicKey = config.values.publicKey;
      const privateKey = config.values.privateKey;
      ok = /^[A-Za-z0-9_-]{40,}$/.test(publicKey) && /^[A-Za-z0-9_-]{40,}$/.test(privateKey) && config.values.subject.includes(":");
      message = ok ? "Browser push keys are valid and ready for device subscriptions." : "VAPID keys or subject are invalid. Generate a fresh key pair and save all three values.";
    } else if (provider === "MONITORING") {
      const response = await fetch(config.values.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "ShopLinkk", type: "connection_test", createdAt: new Date().toISOString() }) });
      ok = response.ok;
      message = ok ? "Monitoring webhook received the test." : "Monitoring webhook rejected the test.";
    }
  } catch {
    ok = false;
    message = "The provider could not be reached.";
  }

  const status: IntegrationStatus = ok ? "CONNECTED" : "ERROR";
  await updateIntegrationTest(provider, status, message);
  return ok ? NextResponse.json({ ok, message }) : jsonError(message, 502);
}
