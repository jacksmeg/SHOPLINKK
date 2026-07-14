"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const fallbackLogo = "/brand/shoplinkk-default.svg";

export function MobileSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [brand, setBrand] = useState({ brandName: "ShopLinkk", logoUrl: fallbackLogo });

  useEffect(() => {
    const isPhone = window.matchMedia("(max-width: 767px)").matches;
    const alreadyShown = window.sessionStorage.getItem("shoplinkk-mobile-splash");
    if (!isPhone || alreadyShown) return;

    setVisible(true);
    window.sessionStorage.setItem("shoplinkk-mobile-splash", "shown");

    fetch("/api/platform")
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        if (!config) return;
        setBrand({
          brandName: config.brandName || "ShopLinkk",
          logoUrl: config.logoUrl || fallbackLogo,
        });
      })
      .catch(() => null);

    const timeout = window.setTimeout(() => setVisible(false), 1700);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white px-6 md:hidden" role="status" aria-label="Opening ShopLinkk">
      <div className="grid justify-items-center gap-4 text-center">
        <span className="grid size-24 place-items-center overflow-hidden rounded-[24px] bg-[var(--brand-soft)] shadow-2xl shadow-blue-950/15 ring-1 ring-blue-100">
          <Image src={brand.logoUrl} alt="" width={256} height={256} className="scale-[1.22] object-contain" priority unoptimized />
        </span>
        <div>
          <p className="text-2xl font-black text-[var(--brand-dark)]">{brand.brandName}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">Dunkwa-on-Offin local marketplace</p>
        </div>
        <span className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-blue-100">
          <span className="block h-full w-1/2 animate-[shoplinkk-splash_1.1s_ease-in-out_infinite] rounded-full bg-[var(--brand)]" />
        </span>
      </div>
    </div>
  );
}
