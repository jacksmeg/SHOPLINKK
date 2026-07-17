import type { Metadata } from "next";
import { AppChrome } from "@/components/layout/app-chrome";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shoplinkk.com"),
  title: {
    default: "ShopLinkk | Dunkwa-on-Offin Marketplace",
    template: "%s | ShopLinkk",
  },
  description:
    "ShopLinkk is a local buying and selling marketplace for Dunkwa-on-Offin, Ghana. Browse listings and chat with sellers before purchase.",
  applicationName: "ShopLinkk",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pwa/shoplinkk-logo-48.png", sizes: "48x48", type: "image/png" },
      { url: "/pwa/shoplinkk-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/shoplinkk-logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/pwa/shoplinkk-logo-192.png",
    apple: "/pwa/shoplinkk-logo-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "ShopLinkk",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <Providers>
          <RegisterServiceWorker />
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
