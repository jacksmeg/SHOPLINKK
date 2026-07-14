"use client";

import { CreditCard, PackagePlus, Pencil, Save, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, titleCase } from "@/lib/utils";
import type { BillingConfig } from "@/lib/billing";

type BillingPackageView = {
  id: string;
  name: string;
  description?: string | null;
  type: "PRODUCT_LISTING" | "ADVERT";
  price: number;
  currency: string;
  durationDays?: number | null;
  listingCount?: number | null;
  placement?: "HOMEPAGE" | "MARKETPLACE" | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { payments: number; advertRequests?: number };
};

export function BillingManager({
  config,
  packages,
}: {
  config: BillingConfig;
  packages: BillingPackageView[];
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(config.activeProvider);
  const [autoApprovePaidListings, setAutoApprovePaidListings] = useState(config.autoApprovePaidListings);
  const [autoRunPaidAdverts, setAutoRunPaidAdverts] = useState(config.autoRunPaidAdverts);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function packagePayload(data: FormData) {
    return {
      name: data.get("name"),
      description: data.get("description"),
      type: data.get("type"),
      price: data.get("price"),
      currency: data.get("currency"),
      durationDays: data.get("durationDays"),
      listingCount: data.get("listingCount"),
      placement: data.get("placement"),
      isActive: Boolean(data.get("isActive")),
      sortOrder: data.get("sortOrder"),
    };
  }

  function saveSettings() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/admin/billing/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProvider: provider, autoApprovePaidListings, autoRunPaidAdverts }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Billing settings saved." : result?.message ?? "Settings could not be saved.");
      if (response.ok) router.refresh();
    });
  }

  function createPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/admin/billing/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...packagePayload(data),
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Package created." : result?.message ?? "Package could not be created.");
      if (response.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function togglePackage(item: BillingPackageView) {
    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/admin/billing/packages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Package updated." : result?.message ?? "Package could not be updated.");
      if (response.ok) router.refresh();
    });
  }

  function updatePackage(event: FormEvent<HTMLFormElement>, item: BillingPackageView) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/admin/billing/packages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packagePayload(data)),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Package saved." : result?.message ?? "Package could not be saved.");
      if (response.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function deletePackage(item: BillingPackageView) {
    const hasHistory = Boolean((item._count?.payments ?? 0) || (item._count?.advertRequests ?? 0));
    const warning = hasHistory
      ? "This package has payment or advert history, so it will be switched off instead of removed. Continue?"
      : "Delete this billing package?";
    if (!window.confirm(warning)) return;

    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/admin/billing/packages/${item.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? result?.message ?? "Package deleted." : result?.message ?? "Package could not be deleted.");
      if (response.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <div className="grid gap-5">
      <section className="app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--ink)]">Gateway control</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Choose the live provider sellers use when paying for listing or advert packages.</p>
          </div>
          <Badge tone="blue">{provider}</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold text-[var(--ink)]">
            Active payment gateway
            <select value={provider} onChange={(event) => setProvider(event.target.value as BillingConfig["activeProvider"])} className="form-control mt-1.5 w-full bg-white px-3 text-xs">
              <option value="PAYSTACK">Paystack</option>
              <option value="KORA">Kora</option>
              <option value="HUBTEL">Hubtel</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--ink)]">
            <input type="checkbox" checked={autoApprovePaidListings} onChange={(event) => setAutoApprovePaidListings(event.target.checked)} className="size-4 accent-[var(--brand)]" />
            Auto-approve paid listings
          </label>
          <label className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--ink)]">
            <input type="checkbox" checked={autoRunPaidAdverts} onChange={(event) => setAutoRunPaidAdverts(event.target.checked)} className="size-4 accent-[var(--brand)]" />
            Auto-run paid adverts
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" disabled={pending} onClick={saveSettings}><Save size={15} /> Save settings</Button>
          <a href="/admin/integrations" className="inline-flex min-h-10 items-center rounded-[7px] px-3 text-xs font-semibold text-[var(--brand-dark)] hover:bg-[var(--brand-soft)]">
            Add gateway keys
          </a>
        </div>
      </section>

      <form onSubmit={createPackage} className="app-panel p-4 sm:p-5">
        <div className="flex items-center gap-2"><PackagePlus size={17} className="text-[var(--brand)]" /><h2 className="text-sm font-black text-[var(--ink)]">Create package</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold text-[var(--ink)]">Name<input name="name" required placeholder="7-day homepage advert" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Type<select name="type" defaultValue="ADVERT" className="form-control mt-1.5 w-full bg-white px-3 text-xs"><option value="PRODUCT_LISTING">Product/service upload</option><option value="ADVERT">Advert campaign</option></select></label>
          <label className="text-xs font-bold text-[var(--ink)]">Price<input name="price" type="number" min="0" step="0.01" required placeholder="50.00" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Currency<input name="currency" defaultValue="GHS" maxLength={3} className="form-control mt-1.5 w-full px-3 text-xs uppercase" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Duration days<input name="durationDays" type="number" min="1" placeholder="7" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Listing count<input name="listingCount" type="number" min="1" placeholder="1" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Placement<select name="placement" defaultValue="" className="form-control mt-1.5 w-full bg-white px-3 text-xs"><option value="">Any</option><option value="HOMEPAGE">Homepage</option><option value="MARKETPLACE">Marketplace</option></select></label>
          <label className="text-xs font-bold text-[var(--ink)]">Sort order<input name="sortOrder" type="number" min="0" defaultValue="0" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
        </div>
        <label className="mt-3 block text-xs font-bold text-[var(--ink)]">Description<textarea name="description" rows={3} className="form-control mt-1.5 w-full resize-none px-3 py-2 text-xs" /></label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isActive" type="checkbox" defaultChecked className="size-4 accent-[var(--brand)]" /> Active</label>
          <Button disabled={pending}><PackagePlus size={15} /> Add package</Button>
        </div>
      </form>

      <section className="grid gap-3 lg:grid-cols-2">
        {packages.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <article key={item.id} className="app-panel app-panel-interactive p-4">
              {isEditing ? (
                <form onSubmit={(event) => updatePackage(event, item)} className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--ink)]">Edit package</h3>
                    <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]">
                      <XCircle size={15} /> Cancel
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-[var(--ink)]">Name<input name="name" required defaultValue={item.name} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Type<select name="type" defaultValue={item.type} className="form-control mt-1.5 w-full bg-white px-3 text-xs"><option value="PRODUCT_LISTING">Product/service upload</option><option value="ADVERT">Advert campaign</option></select></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Price<input name="price" type="number" min="0" step="0.01" required defaultValue={item.price} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Currency<input name="currency" defaultValue={item.currency} maxLength={3} className="form-control mt-1.5 w-full px-3 text-xs uppercase" /></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Duration days<input name="durationDays" type="number" min="1" defaultValue={item.durationDays ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Listing count<input name="listingCount" type="number" min="1" defaultValue={item.listingCount ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Placement<select name="placement" defaultValue={item.placement ?? ""} className="form-control mt-1.5 w-full bg-white px-3 text-xs"><option value="">Any</option><option value="HOMEPAGE">Homepage</option><option value="MARKETPLACE">Marketplace</option></select></label>
                    <label className="text-xs font-bold text-[var(--ink)]">Sort order<input name="sortOrder" type="number" min="0" defaultValue={item.sortOrder} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
                  </div>
                  <label className="text-xs font-bold text-[var(--ink)]">Description<textarea name="description" rows={3} defaultValue={item.description ?? ""} className="form-control mt-1.5 w-full resize-none px-3 py-2 text-xs" /></label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isActive" type="checkbox" defaultChecked={item.isActive} className="size-4 accent-[var(--brand)]" /> Active</label>
                    <Button disabled={pending}><Save size={15} /> Save package</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-[var(--ink)]">{item.name}</h3>
                        <Badge tone={item.isActive ? "green" : "neutral"}>{item.isActive ? "Active" : "Off"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.type.replace("_", " "))}</p>
                    </div>
                    <button type="button" disabled={pending} onClick={() => togglePackage(item)} className="grid size-10 place-items-center rounded-[7px] border border-[var(--line)] text-[var(--brand-dark)] hover:bg-[var(--brand-soft)]" aria-label={item.isActive ? "Disable package" : "Enable package"}>
                      {item.isActive ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}
                    </button>
                  </div>
                  <p className="mt-3 text-lg font-black text-[var(--brand-dark)]">{formatCurrency(item.price)}</p>
                  {item.description ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold text-[var(--muted)]">
                    {item.durationDays ? <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item.durationDays} days</span> : null}
                    {item.listingCount ? <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item.listingCount} listings</span> : null}
                    {item.placement ? <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{titleCase(item.placement)}</span> : null}
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item._count?.payments ?? 0} payments</span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1">{item._count?.advertRequests ?? 0} adverts</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditingId(item.id)}><Pencil size={15} /> Edit</Button>
                    <Button type="button" variant="danger" disabled={pending} onClick={() => deletePackage(item)}><Trash2 size={15} /> Delete</Button>
                  </div>
                </>
              )}
            </article>
          );
        })}
        {!packages.length ? (
          <div className="app-panel p-5 text-center text-xs text-[var(--muted)]">
            <CreditCard className="mx-auto mb-2 text-[var(--brand)]" size={22} />
            No billing packages yet. Create one to start collecting listing or advert fees.
          </div>
        ) : null}
      </section>
      {message ? <p className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 rounded-[8px] bg-[var(--brand-dark)] px-4 py-3 text-xs font-semibold text-white shadow-xl">{message}</p> : null}
    </div>
  );
}
