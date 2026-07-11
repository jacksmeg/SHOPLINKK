"use client";

import Image from "next/image";
import {
  BadgeCheck,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  UsersRound,
} from "lucide-react";

type AuthMode = "login" | "register";

const content = {
  login: {
    heading: "Your marketplace. Your community. Your growth.",
    body: "ShopLinkk connects buyers and sellers across Ghana. Shop local, sell more, and grow together.",
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
    heading: "Join ShopLinkk today",
    body: "Create your account and start buying or selling in your community.",
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
  return (
    <div className="inline-flex items-center gap-2">
      <span className="grid size-10 place-items-center overflow-hidden rounded-[8px] bg-[var(--brand-soft)] shadow-sm ring-1 ring-blue-100">
        <Image
          src="/brand/shoplinkk-mark.webp"
          alt=""
          width={256}
          height={256}
          className="scale-[1.38] object-contain"
          priority
        />
      </span>
      <span className={compact ? "text-lg font-black text-[var(--brand-dark)]" : "text-2xl font-black text-[var(--brand-dark)]"}>
        ShopLinkk
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
    <aside className="relative hidden overflow-hidden border-b border-[var(--line)] bg-white p-5 sm:p-7 lg:block lg:border-b-0 lg:border-r lg:p-8 xl:p-10">
      <div className="relative z-10 flex h-full flex-col">
        <AuthLogoMark />
        <div className="mt-7 max-w-[350px]">
          <h2 className="text-lg font-black leading-6 text-[var(--ink)]">{data.heading}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{data.body}</p>
        </div>

        <div className="mt-7 grid gap-3">
          {data.features.map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-blue-100 bg-[var(--brand-soft)] text-[var(--brand)]">
                <feature.icon size={17} strokeWidth={2.2} />
              </span>
              <span>
                <strong className="block text-xs font-black text-[var(--ink)]">{feature.title}</strong>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--muted)]">{feature.text}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden items-center justify-center lg:flex">
          <div className="relative grid size-36 place-items-center rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--brand)]">
            <Store size={74} strokeWidth={1.45} />
            <span className="absolute right-5 top-4 grid size-10 place-items-center rounded-full border border-blue-100 bg-white shadow-sm">
              <MapPin size={21} />
            </span>
          </div>
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 text-xs shadow-sm">
            <span className="inline-flex items-center gap-2 font-bold text-[var(--ink)]">
              <BadgeCheck size={17} className="text-[var(--gold)]" />
              {data.badge}
            </span>
            <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 font-black text-[var(--brand-dark)]">10K+</span>
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
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-xl">
      <div className="grid min-h-0 lg:min-h-[520px] lg:grid-cols-[0.95fr_1.05fr]">
        <AuthSidePanel mode={mode} />
        <section className="flex items-center p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-[520px]">{children}</div>
        </section>
      </div>
    </div>
  );
}
