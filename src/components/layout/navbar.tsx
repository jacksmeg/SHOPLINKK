"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Home,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageCircle,
  Search,
  Shield,
  ShoppingCart,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { FOOD_CART_CHANGED_EVENT, foodCartCount, readFoodCart } from "@/lib/food-cart";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/categories", label: "Categories" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.split(" ").filter(Boolean)[0];
  return firstName ? `${label}, ${firstName}` : label;
}

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCart() {
      setCartCount(foodCartCount(readFoodCart()));
    }
    syncCart();
    window.addEventListener(FOOD_CART_CHANGED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(FOOD_CART_CHANGED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const dashboardHref =
    session?.user.role === "ADMIN"
      ? "/admin"
      : session?.user.role === "SELLER"
        ? "/seller"
        : "/buyer";

  const mobileItems = status === "authenticated"
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/marketplace", label: "Browse", icon: Search },
        { href: "/cart", label: "Cart", icon: ShoppingCart },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/marketplace", label: "Browse", icon: Search },
        { href: "/cart", label: "Cart", icon: ShoppingCart },
        { href: "/login", label: "Login", icon: LogIn },
        { href: "/register", label: "Sell", icon: Store },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          {status === "authenticated" ? (
            <p className="hidden max-w-[190px] truncate rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand-dark)] xl:block">
              {greeting(session.user.name)}
            </p>
          ) : null}

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-[7px] px-3 py-2 text-xs font-semibold transition",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            <ThemeToggle />
            <ButtonLink href="/marketplace" variant="ghost" aria-label="Search marketplace">
              <Search size={16} />
              Search
            </ButtonLink>
            {status === "authenticated" ? (
              <>
                <Link href="/notifications" className="grid size-10 place-items-center rounded-[7px] text-[var(--muted)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]" aria-label="Notifications">
                  <Bell size={17} />
                </Link>
                <Link href="/chat" className="grid size-10 place-items-center rounded-[7px] text-[var(--muted)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]" aria-label="Chats">
                  <MessageCircle size={17} />
                </Link>
                <ButtonLink href={dashboardHref} variant="secondary">
                  {session.user.role === "ADMIN" ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                  Dashboard
                </ButtonLink>
                <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
                <ButtonLink href="/register"><Store size={16} /> Start selling</ButtonLink>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <Link href="/marketplace" className="grid size-10 place-items-center rounded-[7px] text-[var(--muted)]" aria-label="Search marketplace">
              <Search size={19} />
            </Link>
            <button className="grid size-10 place-items-center rounded-[7px] border border-[var(--line)] bg-white text-[var(--ink)]" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open menu">
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {status === "authenticated" ? (
          <p className="mx-auto max-w-[1440px] px-4 pb-2 text-xs font-black text-[var(--brand-dark)] lg:hidden">
            🙌 {greeting(session.user.name)}
          </p>
        ) : null}

        <div className={cn("grid border-t border-[var(--line)] bg-white transition-[grid-template-rows] duration-200 lg:hidden", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 gap-1 px-4 py-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[7px] px-3 py-2.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {status === "authenticated" ? (
                <>
                  <Link href="/notifications" className="rounded-[7px] px-3 py-2.5 text-xs font-semibold text-[var(--muted)]" onClick={() => setOpen(false)}>Notifications</Link>
                  <button className="rounded-[7px] px-3 py-2.5 text-left text-xs font-semibold text-red-600" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-white/96 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {mobileItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={`${item.href}-${item.label}`} href={item.href} className={cn("flex min-h-[60px] flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold transition", active ? "text-[var(--brand)]" : "text-[var(--muted)]")}>
                <span className="relative">
                  <item.icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                  {item.href === "/cart" && cartCount ? (
                    <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[0.58rem] font-black leading-4 text-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
