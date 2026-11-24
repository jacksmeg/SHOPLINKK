"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

function record(storeId: string, event: "visits" | "whatsappClicks") {
  void fetch(`/api/stores/${encodeURIComponent(storeId)}/traffic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => null);
}

export function StoreTraffic({ storeId, whatsappHref, isOwner }: { storeId: string; whatsappHref?: string | null; isOwner: boolean }) {
  const lastVisited = useRef<string | null>(null);
  useEffect(() => {
    if (isOwner || lastVisited.current === storeId) return;
    lastVisited.current = storeId;
    record(storeId, "visits");
  }, [storeId, isOwner]);

  return whatsappHref ? (
    <ButtonLink href={whatsappHref} target="_blank" rel="noreferrer" variant="secondary" onClick={() => {
      if (!isOwner) record(storeId, "whatsappClicks");
    }}>
      <MessageCircle size={16} /> WhatsApp
    </ButtonLink>
  ) : null;
}
