"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";
const fallbackLogo = "/brand/shoplinkk-default.svg";

const content = {
  login: {
    heading: "Hello, Welcome",
    body: "Don't have an account yet?",
    actionHref: "/register",
    actionLabel: "Create account",
    badge: "Trusted by thousands of Ghanaians",
    features: [
      {
        icon: ShoppingBag,
        title: "Local deals, local impact",
        text: "Discover great products from trusted sellers near you.",
      },
      {
        icon: ShieldCheck,
        title: "Safe & secure",
        text: "Your account is protected with secure sign-in.",
      },
      {
        icon: UsersRound,
        title: "Built for Ghana",
        text: "Designed for local communities and direct seller contact.",
      },
    ],
  },
  register: {
    heading: "Welcome Back!",
    body: "Already have an account?",
    actionHref: "/login",
    actionLabel: "Sign in",
    badge: "Dunkwa-on-Offin ready",
    features: [
      {
        icon: UsersRound,
        title: "Reach more customers",
        text: "List products and grow your business with a local audience.",
      },
      {
        icon: ShoppingBag,
        title: "Great finds, great value",
        text: "Shop quality products and chat before you buy.",
      },
      {
        icon: MapPin,
        title: "Local is better",
        text: "Support sellers around Dunkwa-on-Offin first.",
      },
    ],
  },
};

export function AuthLogoMark({ compact = false }: { compact?: boolean }) {
  const [brand, setBrand] = useState({ brandName: "ShopLinkk", logoUrl: fallbackLogo });

  useEffect(() => {
    fetch("/api/platform")
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        if (!config) return;
        setBrand({ brandName: config.brandName || "ShopLinkk", logoUrl: config.logoUrl || fallbackLogo });
      })
      .catch(() => null);
  }, []);

  const customLogo = brand.logoUrl !== fallbackLogo;

  return (
    <div className="auth-logo-mark inline-flex items-center gap-2">
      <span className="grid size-10 place-items-center overflow-hidden rounded-[8px] bg-[var(--brand-soft)] shadow-sm ring-1 ring-blue-100">
        <Image
          src={brand.logoUrl}
          alt=""
          width={256}
          height={256}
          className={customLogo ? "object-contain" : "scale-[1.38] object-contain"}
          priority
          unoptimized
        />
      </span>
      <span className={compact ? "text-lg font-black text-[var(--brand-dark)]" : "text-2xl font-black text-[var(--brand-dark)]"}>
        {brand.brandName}
      </span>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function AuthSidePanel({ mode }: { mode: AuthMode }) {
  const data = content[mode];

  return (
    <aside className={cn("auth-side-panel relative hidden min-h-[520px] overflow-hidden p-7 text-white lg:flex lg:p-8 xl:p-10", mode === "login" ? "auth-side-panel-login" : "auth-side-panel-register")}>
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
        <div className="auth-side-logo mb-7 rounded-[8px] bg-white/12 p-3 ring-1 ring-white/20">
          <AuthLogoMark compact />
        </div>

        <div className="max-w-[310px]">
          <h2 className="text-2xl font-black leading-8 text-white">{data.heading}</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-white/82">{data.body}</p>
          <Link href={data.actionHref} className="auth-panel-ghost-button mt-5 inline-flex min-h-10 min-w-36 items-center justify-center rounded-full border border-white/80 px-5 text-xs font-black text-white transition">
            {data.actionLabel}
          </Link>
        </div>

        <div className="mt-8 grid w-full max-w-[320px] grid-cols-3 gap-2">
          {data.features.map((feature) => (
            <div key={feature.title} className="auth-feature-row rounded-[8px] border border-white/16 bg-white/10 p-2 text-center backdrop-blur">
              <span className="mx-auto grid size-8 place-items-center rounded-full bg-white/16 text-white">
                <feature.icon size={17} strokeWidth={2.2} />
              </span>
              <strong className="mt-2 block text-[0.62rem] font-black leading-3 text-white">{feature.title}</strong>
            </div>
          ))}
        </div>

        <div className="mt-7 w-full max-w-[320px]">
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/16 bg-white/12 px-3 py-3 text-xs shadow-sm backdrop-blur">
            <span className="inline-flex items-center gap-2 font-bold text-white">
              <BadgeCheck size={17} className="text-[var(--tone-yellow)]" />
              {data.badge}
            </span>
            <span className="rounded-full bg-white px-2 py-1 font-black text-[var(--brand-dark)]">10K+</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AuthPanel({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: AuthMode;
}) {
  return (
    <div className="auth-panel-shell overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-xl">
      <div className={cn("auth-split-grid grid min-h-0 lg:min-h-[520px] lg:grid-cols-2", mode === "register" && "auth-split-grid-register")}>
        {mode === "login" ? <AuthSidePanel mode={mode} /> : null}
        <section className="auth-form-side flex items-center p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-[520px]">{children}</div>
        </section>
        {mode === "register" ? <AuthSidePanel mode={mode} /> : null}
      </div>
    </div>
  );
}
