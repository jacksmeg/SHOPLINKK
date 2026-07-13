"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Boxes,
  ChefHat,
  Circle,
  ClipboardList,
  CreditCard,
  DatabaseBackup,
  FileText,
  Flag,
  GitCompareArrows,
  Gift,
  Heart,
  HeartHandshake,
  History,
  LifeBuoy,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  Newspaper,
  PackagePlus,
  PlugZap,
  Rocket,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Trophy,
  Truck,
  UserRound,
  UserCog,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNavigation({
  links,
}: {
  links: { href: string; label: string; icon: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav-scroll hide-scrollbar flex gap-1 overflow-x-auto lg:grid lg:max-h-[calc(100vh-138px)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1" aria-label="Dashboard navigation">
      {links.map((link) => {
        const active = link.href === pathname || (link.href !== "/admin" && link.href !== "/buyer" && link.href !== "/seller" && pathname.startsWith(`${link.href}/`));
        const Icon = icons[link.icon as keyof typeof icons] ?? Circle;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-10 shrink-0 items-center gap-2 rounded-[7px] px-3 text-xs font-semibold transition",
              active
                ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
            )}
          >
            <Icon size={16} strokeWidth={active ? 2.25 : 1.8} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

const icons = {
  BarChart3,
  Bell,
  Boxes,
  ChefHat,
  ClipboardList,
  CreditCard,
  DatabaseBackup,
  FileText,
  Flag,
  GitCompareArrows,
  Gift,
  Heart,
  HeartHandshake,
  History,
  LifeBuoy,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  Newspaper,
  PackagePlus,
  PlugZap,
  Rocket,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Trophy,
  Truck,
  UserCog,
  UserRound,
  Users,
  Wallet,
  Warehouse,
};
