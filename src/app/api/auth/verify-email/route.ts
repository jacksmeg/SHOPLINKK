import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email")?.toLowerCase();

  if (!token || !email) {
    return NextResponse.redirect(appUrl("/account/security?verified=invalid"));
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: `email-verify:${email}`,
        token,
      },
    },
  });

  if (!record || record.expires < new Date()) {
    const redirectUrl = new URL(appUrl("/account/security"));
    redirectUrl.searchParams.set("verified", "expired");
    redirectUrl.searchParams.set("email", email);
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user
    .update({
      where: { email },
      data: { emailVerified: new Date() },
      select: { id: true },
    })
    .catch(() => null);

  if (!user) {
    return NextResponse.redirect(appUrl("/account/security?verified=invalid"));
  }

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: `email-verify:${email}`,
        token,
      },
    },
  });

  const redirectUrl = new URL(appUrl("/account/security"));
  redirectUrl.searchParams.set("verified", "success");
  redirectUrl.searchParams.set("email", email);
  return NextResponse.redirect(redirectUrl);
}
