import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/chat", "/account"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

