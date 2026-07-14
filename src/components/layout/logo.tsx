"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const fallbackLogo = "/brand/shoplinkk-default.svg";

type BrandState = {
  brandName: string;
  logoUrl: string;
};

export function Logo({ variant = "default" }: { variant?: "default" | "light" }) {
  const [brand, setBrand] = useState<BrandState>({ brandName: "ShopLinkk", logoUrl: fallbackLogo });

  useEffect(() => {
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
  }, []);

  const customLogo = brand.logoUrl !== fallbackLogo;
  const light = variant === "light";

  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label={`${brand.brandName} home`}>
      <span className={`grid size-9 place-items-center overflow-hidden rounded-[8px] shadow-sm ring-1 transition duration-200 group-hover:-rotate-3 group-hover:shadow-lg ${light ? "bg-white ring-white/20" : "bg-[var(--brand-soft)] ring-blue-100"}`}>
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
      <span className={`text-lg font-black ${light ? "text-white" : "text-[var(--ink)]"}`}>
        {brand.brandName === "ShopLinkk" ? <>Shop<span className={light ? "text-cyan-200" : "text-[var(--brand)]"}>Linkk</span></> : brand.brandName}
      </span>
    </Link>
  );
}
