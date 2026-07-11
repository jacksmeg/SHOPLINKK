import { sendEmail, appUrl } from "@/lib/email";
import { prisma } from "@/lib/db";
import { brandedEmail } from "@/lib/email-template";
import { notifyUser } from "@/lib/notifications";

type LoginClientContext = {
  userAgent?: string;
  platform?: string;
  connection?: string;
  timezone?: string;
};

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

  const securityUrl = appUrl("/account/security");
  const loginEmail = brandedEmail({
    title: "New ShopLinkk sign-in",
    intro: `Hello ${user.name || "there"}, we recorded a sign-in to your account.`,
    body: [
      `Time: ${when} (${timezone})`,
      `Network / IP: ${ip} via ${protocol}://${host}`,
      `Account phone: ${user.phone || "Not set"}`,
      `Device: ${platform} - ${connection}`,
      `Browser: ${userAgent.slice(0, 280)}`,
      "",
      "If this was not you, change your password, review your account, and contact ShopLinkk support.",
    ].join("\n"),
    ctaLabel: "Review account security",
    ctaUrl: securityUrl,
  });

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
    text: loginEmail.text,
    html: loginEmail.html,
  });

  return { sent: true };
}
