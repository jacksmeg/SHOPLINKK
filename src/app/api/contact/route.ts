import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { getPlatformConfig } from "@/lib/platform-settings";
import { contactSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "contact", 5, 60_000); if (limited) return limited;
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid message");
  const platform = await getPlatformConfig();
  await sendEmail({
    to: platform.supportEmail,
    subject: `ShopLinkk contact: ${parsed.data.name}`,
    text: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
    html: `<p><strong>From:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(parsed.data.email)}&gt;</p><p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br />")}</p>`,
  });
  return NextResponse.json({ ok: true });
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character); }
