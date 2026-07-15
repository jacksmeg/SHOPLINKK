import { formatGhanaPhone } from "@/lib/ghana";
import { getIntegrationConfig } from "@/lib/integration-settings";

type ArkeselResponse = {
  code?: string | number;
  message?: string;
};

async function arkeselConfig() {
  const config = await getIntegrationConfig("ARKESEL");
  return config.enabled ? config.values : null;
}

async function arkeselOtpRequest(
  path: "send" | "verify",
  payload: Record<string, string | number>,
  apiKey: string,
) {
  // Prefer Arkesel's current v2 endpoint and fall back for existing accounts.
  const urls =
    path === "send"
      ? ["https://sms.arkesel.com/api/v2/otp/send", "https://sms.arkesel.com/api/otp/generate"]
      : ["https://sms.arkesel.com/api/v2/otp/verify", "https://sms.arkesel.com/api/otp/verify"];

  let lastResponse: Response | null = null;
  let lastBody: ArkeselResponse = {};

  for (const url of urls) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as ArkeselResponse;

    if (response.status !== 404) return { response, body };
    lastResponse = response;
    lastBody = body;
  }

  return { response: lastResponse!, body: lastBody };
}

export async function isPhoneOtpProviderEnabled() {
  return Boolean(await arkeselConfig());
}

export async function sendOtp(phone: string, localCode: string) {
  const config = await arkeselConfig();
  if (!config) {
    console.info(`[ShopLinkk SMS preview] ${phone}: your verification code is ${localCode}`);
    return;
  }

  const { response, body } = await arkeselOtpRequest(
    "send",
    {
      expiry: 5,
      length: 6,
      medium: "sms",
      message: "ShopLinkk code: %otp_code%. It expires in %expiry% minutes.",
      number: formatGhanaPhone(phone),
      sender_id: config.senderId,
      type: "numeric",
    },
    config.apiKey,
  );

  if (!response.ok || String(body.code) !== "1000") {
    throw new Error(body.message || "Arkesel could not send the verification code");
  }
}

export async function verifyOtp(phone: string, code: string) {
  const config = await arkeselConfig();
  if (!config) return null;

  const { response, body } = await arkeselOtpRequest(
    "verify",
    { number: formatGhanaPhone(phone), code },
    config.apiKey,
  );

  return response.ok && String(body.code) === "1100";
}

export async function sendSmsAlert(phone: string, message: string) {
  const config = await arkeselConfig();
  const normalizedPhone = formatGhanaPhone(phone);

  if (!config) {
    console.info(`[ShopLinkk SMS preview] ${normalizedPhone}: ${message}`);
    return { queued: false, preview: true };
  }

  const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: { "api-key": config.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: config.senderId || "ShopLinkk",
      message,
      recipients: [normalizedPhone],
    }),
  });
  const body = (await response.json().catch(() => ({}))) as ArkeselResponse;

  if (!response.ok) {
    throw new Error(body.message || "Arkesel could not send the SMS alert");
  }

  return { queued: true, preview: false };
}

export function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
