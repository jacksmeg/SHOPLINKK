"use client";

import Link from "next/link";
import { Crosshair, LoaderCircle, MapPinned, Navigation, Route } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicTown } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";

type Coordinates = { latitude: number; longitude: number };
type MapInstance = { fitBounds(bounds: unknown): void; panTo(position: { lat: number; lng: number }): void; setZoom(zoom: number): void };
type MapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  Marker: new (options: Record<string, unknown>) => unknown;
  LatLngBounds: new () => { extend(position: { lat: number; lng: number }): void };
};

declare global {
  interface Window {
    google?: { maps: MapsApi };
    shoplinkkMapsPromise?: Promise<MapsApi>;
  }
}

function distanceKm(origin: Coordinates, town: PublicTown) {
  const radius = 6371;
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(town.latitude - origin.latitude);
  const deltaLng = radians(town.longitude - origin.longitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(origin.latitude)) * Math.cos(radians(town.latitude)) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.shoplinkkMapsPromise) return window.shoplinkkMapsPromise;

  window.shoplinkkMapsPromise = new Promise<MapsApi>((resolve, reject) => {
    const callbackName = `shoplinkkMapsReady${Date.now()}`;
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

  return window.shoplinkkMapsPromise;
}

export function NearbyTownMap({ towns }: { towns: PublicTown[] }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapsRef = useRef<MapsApi | null>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState("Preparing map...");

  const rankedTowns = useMemo(() => {
    return towns
      .map((town) => ({ town, distance: origin ? distanceKm(origin, town) : null }))
      .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER));
  }, [origin, towns]);

  useEffect(() => {
    let active = true;
    fetch("/api/maps/config", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (config: { enabled?: boolean; apiKey?: string }) => {
        if (!active || !config.enabled || !config.apiKey || !canvasRef.current) {
          setStatus("Interactive map is waiting for an admin Google Maps key.");
          return;
        }
        const maps = await loadMaps(config.apiKey);
        if (!active || !canvasRef.current) return;
        mapsRef.current = maps;
        const bounds = new maps.LatLngBounds();
        const map = new maps.Map(canvasRef.current, {
          center: { lat: 5.9678765, lng: -1.7873448 },
          zoom: 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        mapRef.current = map;
        towns.forEach((town) => {
          const position = { lat: town.latitude, lng: town.longitude };
          bounds.extend(position);
          new maps.Marker({ map, position, title: `${town.name}, ${town.region}` });
        });
        if (towns.length > 1) map.fitBounds(bounds);
        setStatus("");
      })
      .catch(() => setStatus("The map could not load. You can still browse every active town below."));

    return () => { active = false; };
  }, [towns]);

  function locateBuyer() {
    if (!navigator.geolocation) {
      setStatus("Location is not supported on this device. Choose a town from the list.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setOrigin(nextOrigin);
        mapRef.current?.panTo({ lat: nextOrigin.latitude, lng: nextOrigin.longitude });
        mapRef.current?.setZoom(10);
        if (mapsRef.current && mapRef.current) {
          new mapsRef.current.Marker({
            map: mapRef.current,
            position: { lat: nextOrigin.latitude, lng: nextOrigin.longitude },
            title: "Your current location",
          });
        }
        setStatus("Nearest towns are now sorted using your device location.");
        setLocating(false);
      },
      () => {
        setStatus("Location permission was not granted. Choose a town from the list instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <section className="border-y border-[var(--line)] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]"><MapPinned size={14} /> Shop nearby</p>
            <h2 className="mt-1 text-lg font-black text-[var(--ink)]">Find the nearest active town</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">Use your location to sort ShopLinkk markets by road-area proximity, then browse available listings in that town.</p>
          </div>
          <Button type="button" variant="secondary" onClick={locateBuyer} disabled={locating}>
            {locating ? <LoaderCircle className="animate-spin" size={15} /> : <Crosshair size={15} />}
            {locating ? "Finding you..." : "Use my location"}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="grid content-start gap-2">
            {rankedTowns.slice(0, 7).map(({ town, distance }, index) => (
              <Link key={town.id} href={`/marketplace?location=${encodeURIComponent(town.name)}&sort=nearest`} className="town-row group flex min-h-14 items-center gap-3 rounded-[7px] border border-[var(--line)] bg-white px-3 py-2.5 transition hover:border-[var(--brand)] hover:shadow-sm">
                <span className="grid size-8 shrink-0 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]"><Navigation size={14} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[var(--ink)]">{town.name}</span><span className="block truncate text-[0.68rem] text-[var(--muted)]">{town.region}{town.areas.length ? ` · ${town.areas.length} areas` : ""}</span></span>
                <span className="shrink-0 text-right text-[0.68rem] font-semibold text-[var(--muted)]">{distance === null ? (index === 0 ? "Main hub" : "Browse") : `${distance.toFixed(distance < 10 ? 1 : 0)} km`}</span>
              </Link>
            ))}
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] sm:min-h-[360px]">
            <div ref={canvasRef} className="absolute inset-0" aria-label="Map of active ShopLinkk towns" />
            {status ? <div className="absolute inset-0 grid place-items-center bg-[var(--surface-muted)] p-6 text-center"><div><Route className="mx-auto text-[var(--brand)]" size={24} /><p className="mt-3 max-w-sm text-xs leading-5 text-[var(--muted)]">{status}</p></div></div> : null}
          </div>
        </div>
        {status && origin ? <p className="mt-3 text-xs font-semibold text-[var(--brand-dark)]">{status}</p> : null}
      </div>
    </section>
  );
}
