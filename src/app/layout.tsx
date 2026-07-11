import type { Metadata } from "next";
import { AppChrome } from "@/components/layout/app-chrome";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shoplinkk.local"),
  title: {
    default: "ShopLinkk | Dunkwa-on-Offin Marketplace",
    template: "%s | ShopLinkk",
  },
  description:
    "ShopLinkk is a local buying and selling marketplace for Dunkwa-on-Offin, Ghana. Browse listings and chat with sellers before purchase.",
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
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
