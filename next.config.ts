import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self), browsing-topics=()",
  },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const publicAssetCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    const shortUserAssetCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0" }];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: noStore,
      },
      {
        source: "/favicon.ico",
        headers: publicAssetCache,
      },
      {
        source: "/brand/:path*",
        headers: publicAssetCache,
      },
      {
        source: "/pwa/:path*",
        headers: publicAssetCache,
      },
      {
        source: "/marketing/:path*",
        headers: publicAssetCache,
      },
      {
        source: "/uploads/:path*",
        headers: shortUserAssetCache,
      },
    ];
  },
};

export default nextConfig;
