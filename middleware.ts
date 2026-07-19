import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    const nonce = createNonce();
    const csp = buildContentSecurityPolicy(nonce);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const withRequestHeaders = (response: NextResponse) => {
      response.headers.set("x-request-id", requestId);
      response.headers.set("Content-Security-Policy", csp);
      if (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/seller")) {
        response.headers.set("x-robots-tag", "noindex, nofollow");
      }
      return response;
    };

    const host = req.headers.get("host")?.toLowerCase();
    if (host === "shoplinkk.com") {
      const url = req.nextUrl.clone();
      url.hostname = "www.shoplinkk.com";
      return withRequestHeaders(NextResponse.redirect(url, 308));
    }

    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return withRequestHeaders(NextResponse.redirect(new URL("/", req.url)));
    }

    if (pathname.startsWith("/seller") && !["SELLER", "ADMIN"].includes(String(token?.role))) {
      return withRequestHeaders(NextResponse.redirect(new URL("/buyer", req.url)));
    }

    return withRequestHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;
        const protectedPaths = ["/buyer", "/seller", "/admin", "/profile", "/chat", "/favorites", "/notifications", "/account"];
        return protectedPaths.some((path) => pathname.startsWith(path)) ? Boolean(token) : true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|uploads|.*\\..*).*)",
  ],
};

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildContentSecurityPolicy(nonce: string) {
  const production = process.env.NODE_ENV === "production";
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://accounts.google.com",
    "https://apis.google.com",
    "https://challenges.cloudflare.com",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://js.paystack.co",
    "https://checkout.korapay.com",
    "https://js.pusher.com",
    "https://*.pusher.com",
    ...(production ? [] : ["'unsafe-eval'"]),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com https://checkout.paystack.com https://checkout.korapay.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
