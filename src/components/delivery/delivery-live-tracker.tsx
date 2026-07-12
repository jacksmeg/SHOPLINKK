"use client";

import { AlertTriangle, CheckCircle2, MapPinned, Navigation, Phone, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, titleCase } from "@/lib/utils";

type Point = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type LiveDelivery = {
  id: string;
  status: string;
  productName: string;
  deliveryFee: number;
  distanceKm?: number | null;
  estimatedMinutes?: number | null;
  riderDistanceKm?: number | null;
  buyerConfirmedAt?: string | null;
  sellerConfirmedAt?: string | null;
  riderLocation?: { latitude: number; longitude: number; at?: string | null } | null;
  pickup: Point;
  dropoff: Point;
  rider: {
    name?: string | null;
    phone?: string | null;
    image?: string | null;
    vehicleType?: string | null;
    ratingAverage?: number | null;
    ratingCount?: number | null;
  };
};

const steps = ["WAITING_FOR_RIDER", "ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY", "DELIVERED"];

function mapUrl(point: Point) {
  if (point.latitude && point.longitude) return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address || "")}`;
}

async function loadMaps(apiKey: string) {
  const w = window as typeof window & { shoplinkkDeliveryMapsPromise?: Promise<unknown> };
  if (window.google?.maps) return window.google.maps;
  if (w.shoplinkkDeliveryMapsPromise) return w.shoplinkkDeliveryMapsPromise;
  w.shoplinkkDeliveryMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `shoplinkkDeliveryMapsReady${Date.now()}`;
    const callbackWindow = window as unknown as Window & Record<string, unknown>;
    callbackWindow[callbackName] = () => {
      delete callbackWindow[callbackName];
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps did not initialize"));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.appendChild(script);
  });
  return w.shoplinkkDeliveryMapsPromise;
}

export function DeliveryLiveTracker({ deliveryId, viewerRole }: { deliveryId: string; viewerRole: "BUYER" | "SELLER" | "RIDER" | "ADMIN" }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapReadyRef = useRef(false);
  const [delivery, setDelivery] = useState<LiveDelivery | null>(null);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch(`/api/deliveries/${deliveryId}/live`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (active && response.ok) setDelivery(data);
    }
    void load();
    const timer = window.setInterval(load, 7000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [deliveryId]);

  const activeStep = useMemo(() => Math.max(0, steps.indexOf(delivery?.status ?? "WAITING_FOR_RIDER")), [delivery?.status]);

  useEffect(() => {
    if (!delivery || !mapRef.current || mapReadyRef.current) return;
    let active = true;
    fetch("/api/maps/config", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (config: { enabled?: boolean; apiKey?: string }) => {
        if (!active || !config.enabled || !config.apiKey || !mapRef.current) return;
        const maps = (await loadMaps(config.apiKey)) as NonNullable<typeof window.google>["maps"];
        if (!active || !mapRef.current) return;
        mapReadyRef.current = true;
        const points = [delivery.pickup, delivery.dropoff, delivery.riderLocation ? { latitude: delivery.riderLocation.latitude, longitude: delivery.riderLocation.longitude, name: "Rider" } : null]
          .filter(Boolean)
          .filter((point) => point?.latitude && point?.longitude) as Array<Point>;
        const center = points[0] ? { lat: points[0].latitude!, lng: points[0].longitude! } : { lat: 5.9678765, lng: -1.7873448 };
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        const bounds = new maps.LatLngBounds();
        points.forEach((point) => {
          const position = { lat: point.latitude!, lng: point.longitude! };
          bounds.extend(position);
          new maps.Marker({ map, position, title: point.name || point.address || "Delivery point" });
        });
        if (points.length > 1) map.fitBounds(bounds);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [delivery]);

  function confirm(role: "BUYER" | "SELLER") {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Confirmation saved." : result?.message ?? "Could not confirm delivery.");
    });
  }

  function rate() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: "Rated from delivery tracking page" }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Rider rating saved." : result?.message ?? "Could not rate rider.");
    });
  }

  function report(reason: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: "Reported from delivery tracking page" }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Report sent to admin." : result?.message ?? "Could not send report.");
    });
  }

  if (!delivery) {
    return <div className="app-panel p-6 text-xs font-bold text-[var(--muted)]">Loading live delivery tracking...</div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="app-panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] p-4">
          <div>
            <Badge tone={delivery.status === "DELIVERED" ? "green" : delivery.status === "CANCELLED" ? "red" : "blue"}>{titleCase(delivery.status)}</Badge>
            <h1 className="mt-2 text-xl font-black text-[var(--ink)]">{delivery.productName}</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatCurrency(delivery.deliveryFee)}
              {delivery.distanceKm ? ` - ${delivery.distanceKm.toFixed(1)} km` : ""}
              {delivery.estimatedMinutes ? ` - about ${delivery.estimatedMinutes} mins` : ""}
            </p>
          </div>
          {delivery.rider.phone ? (
            <a href={`tel:${delivery.rider.phone}`} className="inline-flex min-h-9 items-center gap-2 rounded-[8px] bg-[var(--brand)] px-3 text-xs font-black text-white">
              <Phone size={14} />
              Call rider
            </a>
          ) : null}
        </div>
        <div className="relative min-h-[320px] bg-[var(--surface-muted)]">
          <div ref={mapRef} className="absolute inset-0" />
          {!mapReadyRef.current ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <MapPinned className="mx-auto text-[var(--brand)]" size={28} />
                <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">Map will appear when Google Maps is enabled. Use the navigation buttons below anytime.</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <a href={mapUrl(delivery.pickup)} target="_blank" className="rounded-[10px] border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--ink)]">
            <Navigation className="mb-2 text-[var(--brand)]" size={16} />
            Pickup: {delivery.pickup.address}
          </a>
          <a href={mapUrl(delivery.dropoff)} target="_blank" className="rounded-[10px] border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--ink)]">
            <MapPinned className="mb-2 text-[var(--brand)]" size={16} />
            Drop-off: {delivery.dropoff.address}
          </a>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <section className="app-panel p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><Truck size={16} /> Delivery progress</h2>
          <ol className="mt-4 grid gap-2">
            {steps.map((step, index) => (
              <li key={step} className={`rounded-[8px] border p-2 text-xs font-bold ${index <= activeStep ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--line)] bg-white text-[var(--muted)]"}`}>
                {titleCase(step)}
              </li>
            ))}
          </ol>
        </section>
        <section className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Rider</h2>
          <p className="mt-2 text-xs font-bold text-[var(--ink)]">{delivery.rider.name || "ShopLinkk rider"}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{titleCase(delivery.rider.vehicleType || "vehicle")}</p>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600"><Star size={14} /> {delivery.rider.ratingAverage ? delivery.rider.ratingAverage.toFixed(1) : "New"} ({delivery.rider.ratingCount || 0})</p>
        </section>
        {viewerRole === "BUYER" || viewerRole === "SELLER" ? (
          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Confirm and report</h2>
            <div className="mt-3 grid gap-2">
              {viewerRole === "BUYER" ? <Button type="button" disabled={pending} onClick={() => confirm("BUYER")}><CheckCircle2 size={14} /> Confirm received</Button> : null}
              {viewerRole === "SELLER" ? <Button type="button" disabled={pending} onClick={() => confirm("SELLER")}><CheckCircle2 size={14} /> Confirm handover</Button> : null}
              {viewerRole === "BUYER" && delivery.status === "DELIVERED" ? (
                <div className="grid gap-2 rounded-[8px] bg-[var(--surface-muted)] p-3">
                  <label className="text-xs font-bold text-[var(--ink)]">Rate rider
                    <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="form-control mt-1 w-full bg-white px-3 text-xs">
                      {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                    </select>
                  </label>
                  <Button type="button" variant="secondary" disabled={pending} onClick={rate}><Star size={14} /> Save rating</Button>
                </div>
              ) : null}
              <Button type="button" variant="secondary" disabled={pending} onClick={() => report("LATE_DELIVERY")}><AlertTriangle size={14} /> Report issue</Button>
            </div>
            {message ? <p className="mt-3 text-xs font-bold text-[var(--brand-dark)]">{message}</p> : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
