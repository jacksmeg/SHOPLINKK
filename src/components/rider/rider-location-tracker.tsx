"use client";

import { Crosshair, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RiderLocationTracker({ deliveryId }: { deliveryId?: string | null }) {
  const [status, setStatus] = useState("Waiting for GPS permission.");
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!deliveryId) {
      setStatus("No active delivery to track.");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("GPS is not supported on this device.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSentAt.current < 8000) return;
        lastSentAt.current = now;
        try {
          await fetch("/api/rider/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deliveryId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
            }),
          });
          setStatus(`Live GPS shared ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        } catch {
          setStatus("GPS update could not be sent.");
        }
      },
      () => setStatus("Allow location permission to share live delivery tracking."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [deliveryId]);

  return (
    <div className="rounded-[10px] border border-cyan-200 bg-cyan-50 p-3 text-xs font-bold text-cyan-950">
      <span className="inline-flex items-center gap-2">
        {status.startsWith("Waiting") ? <LoaderCircle className="animate-spin" size={14} /> : <Crosshair size={14} />}
        {status}
      </span>
    </div>
  );
}
