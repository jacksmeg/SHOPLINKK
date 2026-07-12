import { Bell, ClipboardList, Gauge, History, UserRound, WalletCards } from "lucide-react";

export const riderLinks = [
  { href: "/rider", label: "Dashboard", icon: Gauge },
  { href: "/rider/requests", label: "Requests", icon: Bell },
  { href: "/rider/deliveries", label: "Deliveries", icon: ClipboardList },
  { href: "/rider/history", label: "History", icon: History },
  { href: "/rider/wallet", label: "Wallet", icon: WalletCards },
  { href: "/rider/profile", label: "Profile", icon: UserRound },
];
