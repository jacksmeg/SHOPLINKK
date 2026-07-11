"use client";

import { LocateFixed, MapPin, Plus, Power, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Town = { id: string; name: string; region: string; latitude: number | null; longitude: number | null; isActive: boolean; areas: { id: string; name: string; isActive: boolean }[] };

export function TownManager({ towns }: { towns: Town[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submitTown(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => {
      const response = await fetch("/api/admin/towns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "town", name: data.get("name"), region: data.get("region"), latitude: data.get("latitude"), longitude: data.get("longitude") }) });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Town added with map coordinates." : result?.message ?? "Town could not be added."); if (response.ok) form.reset(); router.refresh();
    });
  }

  function addArea(event: FormEvent<HTMLFormElement>, townId: string) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => {
      const response = await fetch("/api/admin/towns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "area", townId, name: data.get("name") }) });
      setMessage(response.ok ? "Area added." : "Area could not be added."); if (response.ok) form.reset(); router.refresh();
    });
  }

  function toggle(townId: string, active: boolean) {
    startTransition(async () => { await fetch(`/api/admin/towns/${townId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !active }) }); router.refresh(); });
  }

  function updateCoordinates(event: FormEvent<HTMLFormElement>, townId: string) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => {
      const response = await fetch(`/api/admin/towns/${townId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: data.get("latitude"), longitude: data.get("longitude") }) });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Map coordinates updated." : result?.message ?? "Coordinates could not be updated.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={submitTown} className="app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Add expansion town</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.75fr_0.75fr_auto]">
          <input name="name" required placeholder="Town name" className="form-control px-3" />
          <input name="region" required placeholder="Region" className="form-control px-3" />
          <input name="latitude" required type="number" step="any" min="-90" max="90" placeholder="Latitude" className="form-control px-3" />
          <input name="longitude" required type="number" step="any" min="-180" max="180" placeholder="Longitude" className="form-control px-3" />
          <Button type="submit" disabled={pending}><Plus size={15} /> Add town</Button>
        </div>
        {message ? <p className="mt-3 text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {towns.map((town) => (
          <section key={town.id} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><MapPin size={16} /> {town.name}</h3><p className="mt-1 text-xs text-[var(--muted)]">{town.region} · {town.areas.length} areas</p></div>
              <button type="button" onClick={() => toggle(town.id, town.isActive)} disabled={pending} className={`grid size-9 place-items-center rounded-[7px] border ${town.isActive ? "border-blue-200 bg-[var(--brand-soft)] text-[var(--brand)]" : "border-[var(--line)] text-[var(--muted)]"}`} title={town.isActive ? "Disable town" : "Enable town"}><Power size={15} /></button>
            </div>
            <form onSubmit={(event) => updateCoordinates(event, town.id)} className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
              <label className="min-w-0 text-[0.68rem] font-semibold text-[var(--muted)]">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" required defaultValue={town.latitude ?? ""} className="form-control mt-1 w-full px-2 text-xs" /></label>
              <label className="min-w-0 text-[0.68rem] font-semibold text-[var(--muted)]">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" required defaultValue={town.longitude ?? ""} className="form-control mt-1 w-full px-2 text-xs" /></label>
              <button type="submit" disabled={pending} title="Save map coordinates" className="mt-5 grid size-10 place-items-center rounded-[7px] border border-[var(--line-strong)] text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"><Save size={15} /></button>
            </form>
            <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-[var(--muted)]"><LocateFixed size={13} /> Used for nearest-town distance and map markers.</p>
            <div className="mt-4 flex flex-wrap gap-2">{town.areas.map((area) => <Badge key={area.id} tone={area.isActive ? "green" : "neutral"}>{area.name}</Badge>)}{!town.areas.length ? <span className="text-xs text-[var(--muted)]">No areas added yet.</span> : null}</div>
            <form onSubmit={(event) => addArea(event, town.id)} className="mt-4 flex gap-2 border-t border-[var(--line)] pt-4"><input name="name" required placeholder="Add area or suburb" className="form-control min-w-0 flex-1 px-3 text-xs" /><Button type="submit" variant="secondary" disabled={pending}><Plus size={14} /> Area</Button></form>
          </section>
        ))}
      </div>
    </div>
  );
}
