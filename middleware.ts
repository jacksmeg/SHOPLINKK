import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/seller") && !["SELLER", "ADMIN"].includes(String(token?.role))) {
      return NextResponse.redirect(new URL("/buyer", req.url));
    }

    return NextResponse.next();
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
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/profile/:path*", "/chat/:path*", "/favorites/:path*", "/notifications/:path*", "/account/:path*"],
};
