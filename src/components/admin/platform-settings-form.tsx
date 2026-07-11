"use client";

import { Save, ShieldCheck } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import type { PlatformConfig } from "@/lib/platform-settings";
import { Button } from "@/components/ui/button";

const toggles: { key: keyof PlatformConfig; label: string; description: string }[] = [
  { key: "listingApproval", label: "Review listings before publishing", description: "New listings stay pending until an admin approves them." },
  { key: "allowRegistration", label: "Allow new registrations", description: "Turn this off temporarily if registration abuse is detected." },
  { key: "requireEmailVerification", label: "Require verified email for password login", description: "Users must click the email verification link before signing in." },
  { key: "requirePhoneVerification", label: "Require verified phone for trusted actions", description: "Use with Arkesel OTP when phone verification is ready." },
  { key: "maintenanceMode", label: "Maintenance mode", description: "Marks the platform as undergoing maintenance for deployment planning." },
];

export function PlatformSettingsForm({ config }: { config: PlatformConfig }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = {
      supportEmail: String(data.get("supportEmail") ?? ""),
      supportPhone: String(data.get("supportPhone") ?? ""),
      defaultTown: String(data.get("defaultTown") ?? ""),
      safetyBanner: String(data.get("safetyBanner") ?? ""),
      listingExpiryDays: Number(data.get("listingExpiryDays")),
      maxProductImages: Number(data.get("maxProductImages")),
      listingApproval: data.get("listingApproval") === "on",
      allowRegistration: data.get("allowRegistration") === "on",
      requireEmailVerification: data.get("requireEmailVerification") === "on",
      requirePhoneVerification: data.get("requirePhoneVerification") === "on",
      maintenanceMode: data.get("maintenanceMode") === "on",
    };

    startTransition(async () => {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Platform settings saved." : result?.message ?? "Settings could not be saved.");
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <section className="app-panel p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><ShieldCheck size={17} /> Marketplace identity</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[var(--ink)]">Support email<input name="supportEmail" type="email" defaultValue={config.supportEmail} className="form-control mt-1.5 w-full px-3" /></label>
          <label className="text-xs font-semibold text-[var(--ink)]">Support phone<input name="supportPhone" type="tel" defaultValue={config.supportPhone} className="form-control mt-1.5 w-full px-3" /></label>
          <label className="text-xs font-semibold text-[var(--ink)]">Default town<input name="defaultTown" defaultValue={config.defaultTown} className="form-control mt-1.5 w-full px-3" /></label>
          <label className="text-xs font-semibold text-[var(--ink)]">Listing expiry days<input name="listingExpiryDays" type="number" min="7" max="365" defaultValue={config.listingExpiryDays} className="form-control mt-1.5 w-full px-3" /></label>
          <label className="text-xs font-semibold text-[var(--ink)]">Maximum product images<input name="maxProductImages" type="number" min="1" max="12" defaultValue={config.maxProductImages} className="form-control mt-1.5 w-full px-3" /></label>
          <label className="text-xs font-semibold text-[var(--ink)] sm:col-span-2">Safety reminder<textarea name="safetyBanner" rows={3} defaultValue={config.safetyBanner} className="form-control mt-1.5 w-full resize-y px-3 py-2" /></label>
        </div>
      </section>

      <section className="app-panel divide-y divide-[var(--line)] px-4 sm:px-5">
        {toggles.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4 py-4">
            <span><span className="block text-xs font-bold text-[var(--ink)]">{item.label}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{item.description}</span></span>
            <input name={item.key} type="checkbox" defaultChecked={Boolean(config[item.key])} className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
          </label>
        ))}
      </section>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}><Save size={15} /> Save settings</Button>{message ? <p className="text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}</div>
    </form>
  );
}
