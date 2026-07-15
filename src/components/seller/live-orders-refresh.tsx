"use client";

import { RefreshCw, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LiveOrdersRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nextRefresh, setNextRefresh] = useState(seconds);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNextRefresh((current) => {
        if (current <= 1) {
          startTransition(() => router.refresh());
          return seconds;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [router, seconds]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-xs shadow-sm">
      <span className="inline-flex items-center gap-2 font-black text-[var(--brand-dark)]">
        <Wifi size={15} />
        Live view on
      </span>
      <span className="text-[var(--muted)]">refreshing in {nextRefresh}s</span>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setNextRefresh(seconds);
          startTransition(() => router.refresh());
        }}
        className="min-h-8 px-3"
      >
        <RefreshCw size={13} className={pending ? "animate-spin" : ""} />
        Refresh
      </Button>
    </div>
  );
}
