import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShopLinkk",
    short_name: "ShopLinkk",
    description: "Buy and sell locally in Dunkwa-on-Offin with direct buyer-seller chat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2f66",
    orientation: "portrait",
    icons: [
      {
        src: "/brand/shoplinkk-mark.webp",
        sizes: "256x256",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/brand/shoplinkk-mark.webp",
        sizes: "256x256",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
  };
}
