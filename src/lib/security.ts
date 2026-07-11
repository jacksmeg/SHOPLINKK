import { sendEmail, appUrl } from "@/lib/email";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

type LoginClientContext = {
  userAgent?: string;
  platform?: string;
  connection?: string;
  timezone?: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function firstHeader(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name)?.split(",")[0]?.trim();
    if (value) return value;
  }
  return "Unavailable";
}

export async function sendLoginAlert(userId: string, request: Request, client: LoginClientContext = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailAlertsEnabled: true,
      lastLoginAlertAt: true,
    },
  });

  if (!user?.email || !user.emailAlertsEnabled) return { sent: false, reason: "disabled" };

  const now = new Date();
  const cooldown = new Date(now.getTime() - 5 * 60_000);
  const claimed = await prisma.user.updateMany({
    where: {
      id: user.id,
      emailAlertsEnabled: true,
      OR: [{ lastLoginAlertAt: null }, { lastLoginAlertAt: { lt: cooldown } }],
    },
    data: { lastLoginAlertAt: now },
  });

  if (!claimed.count) return { sent: false, reason: "cooldown" };

  const ip = firstHeader(request, ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "Unavailable";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const userAgent = client.userAgent || request.headers.get("user-agent") || "Unavailable";
  const platform = client.platform || "Unavailable";
  const connection = client.connection || "Unavailable";
  const timezone = client.timezone || "Unavailable";

  let when: string;
  try {
    when = now.toLocaleString("en-GH", { timeZone: timezone === "Unavailable" ? "Africa/Accra" : timezone });
  } catch {
    when = now.toLocaleString("en-GH", { timeZone: "Africa/Accra" });
  }

  const safe = {
    name: escapeHtml(user.name || "there"),
    ip: escapeHtml(ip),
    host: escapeHtml(host),
    protocol: escapeHtml(protocol),
    userAgent: escapeHtml(userAgent.slice(0, 280)),
    platform: escapeHtml(platform.slice(0, 100)),
    connection: escapeHtml(connection),
    timezone: escapeHtml(timezone),
    when: escapeHtml(when),
    phone: escapeHtml(user.phone || "Not set"),
  };
  const securityUrl = appUrl("/account/security");

  await notifyUser({
    userId: user.id,
    type: "SECURITY",
    title: "New ShopLinkk sign-in",
    body: `A sign-in was recorded from ${ip}. If this was not you, change your password immediately.`,
    href: "/account/security",
  });

  await sendEmail({
    to: user.email,
    subject: "New sign-in to your ShopLinkk account",
    text: `A new ShopLinkk sign-in was recorded on ${when}. IP/network: ${ip}. Account phone: ${user.phone || "Not set"}. Device: ${platform}. Browser: ${userAgent.slice(0, 280)}. If this was not you, change your password: ${securityUrl}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0d1321;max-width:620px"><h2 style="color:#0b2f66">New ShopLinkk sign-in</h2><p>Hello ${safe.name}, we recorded a sign-in to your account.</p><table style="border-collapse:collapse;width:100%;font-size:14px"><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Time</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.when} (${safe.timezone})</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Network / IP</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.ip} via ${safe.protocol}://${safe.host}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Account phone</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.phone}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Device</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.platform} - ${safe.connection}</td></tr><tr><td style="padding:8px"><strong>Browser</strong></td><td style="padding:8px">${safe.userAgent}</td></tr></table><p style="margin-top:20px"><strong>If this was not you:</strong> change your password, review your account, and contact ShopLinkk support.</p><p><a href="${securityUrl}" style="color:#0b2f66;font-weight:bold">Review account security</a></p></div>`,
  });

  return { sent: true };
}
