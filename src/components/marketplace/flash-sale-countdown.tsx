"use client";

import { useEffect, useMemo, useState } from "react";

function formatTime(ms: number) {
  if (ms <= 0) return "Ended";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function FlashSaleCountdown({ endsAt, compact = false }: { endsAt?: Date | string | null; compact?: boolean }) {
  const endTime = useMemo(() => (endsAt ? new Date(endsAt).getTime() : 0), [endsAt]);
  const [remaining, setRemaining] = useState(() => endTime - Date.now());

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(endTime - Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [endTime]);

  if (!endTime || remaining <= 0) return null;

  return (
    <span className={`inline-flex items-center rounded-full bg-red-600 font-black text-white shadow-sm ${compact ? "px-2 py-1 text-[0.68rem]" : "px-2.5 py-1.5 text-xs"}`}>
      {compact ? "Ends " : "Time left: "}{formatTime(remaining)}
    </span>
  );
}
