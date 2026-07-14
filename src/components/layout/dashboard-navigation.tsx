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
    <nav className="dashboard-nav-scroll grid max-h-[232px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:max-h-[calc(100vh-138px)] lg:grid-cols-1 lg:gap-1 lg:overflow-y-auto lg:overflow-x-hidden" aria-label="Dashboard navigation">
      {links.map((link) => {
        const active = link.href === pathname || (link.href !== "/admin" && link.href !== "/buyer" && link.href !== "/seller" && pathname.startsWith(`${link.href}/`));
        const Icon = icons[link.icon as keyof typeof icons] ?? Circle;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-10 min-w-0 items-center gap-2 rounded-[7px] px-3 text-xs font-semibold transition",
              active
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-[var(--surface-muted)] text-[var(--muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)] lg:bg-transparent",
            )}
          >
            <Icon size={16} strokeWidth={active ? 2.25 : 1.8} />
            <span className="truncate">{link.label}</span>
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
