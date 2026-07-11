"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";

export function AdvertRequestButton({ productId, productTitle }: { productId: string; productTitle: string }) {
  return (
    <Link
      href={`/seller/products/${productId}/advertise`}
      title={`Request advert for ${productTitle}`}
      className="uiverse-sheen button-sheen-blue inline-flex min-h-9 items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-3 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--brand)] hover:text-[var(--brand-dark)]"
    >
      <Megaphone size={14} /> Advertise
    </Link>
  );
}
