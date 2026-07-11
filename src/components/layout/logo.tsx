"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const fallbackLogo = "/brand/shoplinkk-mark.webp";

type BrandState = {
  brandName: string;
  logoUrl: string;
};

export function Logo() {
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

  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label={`${brand.brandName} home`}>
      <span className="grid size-9 place-items-center overflow-hidden rounded-[8px] bg-[var(--brand-soft)] shadow-sm ring-1 ring-blue-100 transition duration-200 group-hover:-rotate-3 group-hover:shadow-lg">
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
      <span className="text-lg font-black text-[var(--ink)]">
        {brand.brandName === "ShopLinkk" ? <>Shop<span className="text-[var(--brand)]">Linkk</span></> : brand.brandName}
      </span>
    </Link>
  );
}
