import { Bell, ChefHat, ClipboardList, CreditCard, FileText, Megaphone, MessageCircle, RotateCcw, Settings, Store, Truck } from "lucide-react";

export const sellerFoodLinks = [
  { href: "/seller/food", label: "Food dashboard", icon: ChefHat },
  { href: "/seller/food/menu", label: "Menu items", icon: ClipboardList },
  { href: "/seller/food/orders", label: "Orders", icon: Store },
  { href: "/seller/delivery", label: "Delivery", icon: Truck },
  { href: "/seller/payouts", label: "Finance", icon: CreditCard },
  { href: "/seller/returns", label: "Returns", icon: RotateCcw },
  { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
  { href: "/seller/reports", label: "Reports", icon: FileText },
  { href: "/seller/store", label: "Store settings", icon: Settings },
  { href: "/seller/notifications", label: "Notifications", icon: Bell },
  { href: "/chat", label: "Buyer messages", icon: MessageCircle },
];
