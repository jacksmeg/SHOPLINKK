import type { Metadata } from "next";
import { SellOnShoplinkkClient } from "@/components/seller/sell-on-shoplinkk-client";

export const metadata: Metadata = {
  title: "Sell on ShopLinkk",
  description: "Create a ShopLinkk seller account for Dunkwa-on-Offin. Sell products, services, food, adverts, and delivery-ready offers to local buyers.",
};

export default function SellOnShoplinkkPage() {
  return <SellOnShoplinkkClient />;
}
