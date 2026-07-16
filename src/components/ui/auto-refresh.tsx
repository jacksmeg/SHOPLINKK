"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 text-[0.68rem] font-black text-[var(--brand-dark)]">
      <RefreshCw size={13} />
      Live refresh {seconds}s
    </span>
  );
}
