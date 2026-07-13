"use client";

import { MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Address = {
  id: string;
  label: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
};

export function AddressBookManager({ defaultPhone, defaultAddress }: { defaultPhone?: string | null; defaultAddress?: string | null }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("shoplinkk-addresses");
    if (saved) {
      setAddresses(JSON.parse(saved) as Address[]);
      return;
    }
    if (defaultAddress) {
      setAddresses([{ id: "default", label: "Home", address: defaultAddress, phone: defaultPhone ?? "" }]);
    }
  }, [defaultAddress, defaultPhone]);

  useEffect(() => {
    window.localStorage.setItem("shoplinkk-addresses", JSON.stringify(addresses));
  }, [addresses]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAddresses((current) => [
      {
        id: crypto.randomUUID(),
        label: String(form.get("label") ?? "Home"),
        address: String(form.get("address") ?? ""),
        phone: String(form.get("phone") ?? ""),
      },
      ...current,
    ]);
    event.currentTarget.reset();
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setMessage("Location detection is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddresses((current) => [
          {
            id: crypto.randomUUID(),
            label: "GPS location",
            address: "Detected current location",
            phone: defaultPhone ?? "",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          ...current,
        ]);
        setMessage("GPS location saved on this device.");
      },
      () => setMessage("Could not detect location. Check browser permission."),
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Add address</h2>
        <div className="mt-4 grid gap-3">
          <input name="label" placeholder="Home, Work, School..." required className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 text-sm" />
          <textarea name="address" placeholder="Address or delivery note" required rows={4} className="rounded-[8px] border border-[var(--line)] px-3 py-3 text-sm" />
          <input name="phone" placeholder="Phone number" defaultValue={defaultPhone ?? ""} className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button type="submit"><Plus size={16} /> Save address</Button>
            <Button type="button" variant="secondary" onClick={detectLocation}><MapPin size={16} /> Use GPS</Button>
          </div>
          {message ? <p className="rounded-[8px] bg-blue-50 p-3 text-xs font-bold text-blue-900">{message}</p> : null}
        </div>
      </form>
      <section className="app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Saved addresses</h2>
        <div className="mt-4 grid gap-3">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--ink)]">{address.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{address.address}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{address.phone || "No phone"}{address.latitude ? ` - ${address.latitude.toFixed(5)}, ${address.longitude?.toFixed(5)}` : ""}</p>
                </div>
                <button type="button" className="grid size-9 place-items-center rounded-[7px] border border-[var(--line)] text-red-700" onClick={() => setAddresses((current) => current.filter((item) => item.id !== address.id))} aria-label="Remove address">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
          {!addresses.length ? <p className="text-xs text-[var(--muted)]">Save home, work, school, or GPS delivery points here.</p> : null}
        </div>
      </section>
    </div>
  );
}
