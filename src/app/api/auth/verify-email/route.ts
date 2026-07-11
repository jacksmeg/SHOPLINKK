import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email")?.toLowerCase();

  if (!token || !email) {
    return NextResponse.redirect(appUrl("/login?verified=invalid"));
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
    const redirectUrl = new URL(appUrl("/login"));
    redirectUrl.searchParams.set("verified", "expired");
    redirectUrl.searchParams.set("email", email);
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user
    .update({
      where: { email },
      data: { emailVerified: new Date() },
      select: { role: true },
    })
    .catch(() => null);

  if (!user) {
    return NextResponse.redirect(appUrl("/login?verified=invalid"));
  }

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: `email-verify:${email}`,
        token,
      },
    },
  });

  const redirectUrl = new URL(appUrl("/login"));
  redirectUrl.searchParams.set("verified", "success");
  redirectUrl.searchParams.set("email", email);
  redirectUrl.searchParams.set("next", user.role === "SELLER" ? "seller" : user.role === "ADMIN" ? "admin" : "buyer");
  return NextResponse.redirect(redirectUrl);
}
