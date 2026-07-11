import { logError, logInfo } from "@/lib/logger";
import { getIntegrationConfig } from "@/lib/integration-settings";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: EmailInput) {
  const email = await getIntegrationConfig("RESEND");
  const apiKey = email.enabled ? email.values.apiKey : "";
  const from = email.values.from || "ShopLinkk <no-reply@shoplinkk.com>";

  if (!apiKey) {
    logInfo("Email preview", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { queued: false, preview: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    logError("Email provider rejected a message", response.status, {
      to: input.to,
      subject: input.subject,
    });
    throw new Error(`Email provider rejected the message: ${response.status}`);
  }

  return { queued: true, preview: false };
}

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
