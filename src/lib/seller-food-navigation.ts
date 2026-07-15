import { Bell, ChefHat, ClipboardList, Megaphone, MessageCircle, Settings, Store } from "lucide-react";

export const sellerFoodLinks = [
  { href: "/seller/food", label: "Food dashboard", icon: ChefHat },
  { href: "/seller/food/menu", label: "Menu items", icon: ClipboardList },
  { href: "/seller/food/orders", label: "Orders", icon: Store },
  { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
  { href: "/seller/store", label: "Store settings", icon: Settings },
  { href: "/seller/notifications", label: "Notifications", icon: Bell },
  { href: "/chat", label: "Buyer messages", icon: MessageCircle },
];
