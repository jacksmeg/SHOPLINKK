import { appUrl } from "@/lib/email";

type BrandedEmailInput = {
  title: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  body?: string;
};

const operator = {
  name: "JACK STUDIOS",
  phone: "0549896901",
  address: "Dunkwa-on-Offin, Central Region, Ghana",
  email: "jacksmeg99@gmail.com",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

export function brandedEmail(input: BrandedEmailInput) {
  const logoUrl = appUrl("/api/platform/logo");
  const safeCtaUrl = input.ctaUrl ? escapeHtml(input.ctaUrl) : "";
  const safeBody = input.body ? escapeHtml(input.body).replace(/\n/g, "<br>") : "";
  const cta = input.ctaLabel && input.ctaUrl
    ? `<p style="margin:24px 0 8px"><a href="${safeCtaUrl}" style="display:inline-block;background:#0b2f66;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px">${escapeHtml(input.ctaLabel)}</a></p><p style="font-size:13px;line-height:1.6;color:#465267">If the button does not open, copy and paste this link:<br><a href="${safeCtaUrl}" style="color:#0b2f66;word-break:break-all">${safeCtaUrl}</a></p>`
    : "";

  const html = `
    <div style="margin:0;background:#ffffff;color:#0d1321;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:620px;margin:0 auto;padding:28px 18px">
        <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#ffffff">
          <div style="padding:24px 24px 10px">
            <img src="${logoUrl}" width="56" height="56" alt="ShopLinkk" style="display:block;border:0;border-radius:12px">
            <h1 style="margin:16px 0 8px;font-size:22px;line-height:1.25;color:#061a3a">${escapeHtml(input.title)}</h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:#465267">${escapeHtml(input.intro)}</p>
            ${safeBody ? `<p style="font-size:15px;line-height:1.7;color:#465267">${safeBody}</p>` : ""}
            ${cta}
          </div>
          <div style="border-top:1px solid #e2e8f0;background:#f8fafc;padding:18px 24px;font-size:12px;line-height:1.7;color:#657083">
            <strong style="color:#061a3a">${operator.name}</strong><br>
            ${operator.phone}<br>
            ${operator.address}<br>
            Gmail: <a href="mailto:${operator.email}" style="color:#0b2f66">${operator.email}</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    input.title,
    "",
    input.intro,
    input.body ? `\n${input.body}` : "",
    input.ctaUrl ? `\n${input.ctaLabel ?? "Open link"}: ${input.ctaUrl}` : "",
    "",
    operator.name,
    operator.phone,
    operator.address,
    `Gmail: ${operator.email}`,
  ].filter(Boolean).join("\n");

  return { html, text };
}
