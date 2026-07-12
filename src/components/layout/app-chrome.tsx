"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { InstallAppButton } from "@/components/layout/install-app-button";
import { MobileSplashScreen } from "@/components/layout/mobile-splash-screen";
import { NavBar } from "@/components/layout/navbar";
import { NotificationHub } from "@/components/notifications/notification-hub";

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [safetyBanner, setSafetyBanner] = useState("");
  const [showSafety, setShowSafety] = useState(true);
  const authPage = authPaths.some((path) => pathname.startsWith(path));
  const marketplacePage = pathname === "/marketplace" || pathname.startsWith("/products/");

  useEffect(() => {
    fetch("/api/platform")
      .then((response) => response.ok ? response.json() : null)
      .then((config) => {
        if (!config) return;
        setSafetyBanner(config.safetyBanner ?? "");
        if (config.maintenanceMode && !pathname.startsWith("/admin") && pathname !== "/maintenance") router.replace("/maintenance");
      })
      .catch(() => null);
  }, [pathname, router]);

  useEffect(() => {
    if (!marketplacePage || !showSafety || !safetyBanner) return;
    const timeout = window.setTimeout(() => setShowSafety(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [marketplacePage, safetyBanner, showSafety]);

  return (
    <div className="shoplinkk-shell flex min-h-screen flex-col">
      <MobileSplashScreen />
      {authPage ? null : <NavBar />}
      <main className={authPage ? "flex-1" : "mobile-safe-bottom flex-1"}>
        {!authPage && marketplacePage && showSafety && safetyBanner ? (
          <div className="border-b border-cyan-200 bg-[var(--gold-soft)]">
            <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-950 sm:px-6 lg:px-8"><ShieldAlert size={14} className="shrink-0" /><span className="min-w-0 flex-1">{safetyBanner}</span><button type="button" onClick={() => setShowSafety(false)} className="grid size-7 place-items-center rounded-[6px]" aria-label="Dismiss safety reminder"><X size={14} /></button></div>
          </div>
        ) : null}
        {children}
      </main>
      {authPage ? null : <Footer />}
      {authPage ? null : <InstallAppButton />}
      <NotificationHub />
    </div>
  );
}
