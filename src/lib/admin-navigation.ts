import {
  Boxes,
  ClipboardList,
  Flag,
  MapPinned,
  PlugZap,
  Rocket,
  Settings,
  Shield,
  Tags,
  Users,
} from "lucide-react";

export const adminLinks = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/boosts", label: "Boosts", icon: Rocket },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/towns", label: "Towns", icon: MapPinned },
  { href: "/admin/integrations", label: "API connections", icon: PlugZap },
  { href: "/admin/settings", label: "Platform settings", icon: Settings },
  { href: "/admin/audit-log", label: "Audit log", icon: ClipboardList },
];
