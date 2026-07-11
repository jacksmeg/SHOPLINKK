"use client";

import Image from "next/image";
import { Camera, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/components/forms/upload-helper";
import { dunkwaAreas } from "@/lib/ghana";

type StoreFormValue = {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  area?: string | null;
  address?: string | null;
  openingHours?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export function StoreForm({ store }: { store?: StoreFormValue | null }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(store?.coverUrl ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function upload(target: "logo" | "cover", file?: File) {
    if (!file) return;
    setMessage("Uploading image...");
    try {
      const url = await uploadImage(file, target === "logo" ? "store-logo" : "store-cover");
      if (target === "logo") setLogoUrl(url);
      if (target === "cover") setCoverUrl(url);
      setMessage("Image uploaded. Save store to keep it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/seller/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          phone: formData.get("phone"),
          whatsapp: formData.get("whatsapp"),
          location: formData.get("location"),
          area: formData.get("area"),
          address: formData.get("address"),
          openingHours: formData.get("openingHours"),
          logoUrl,
          coverUrl,
        }),
      });
      setMessage(response.ok ? "Store saved." : "Could not save store.");
      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className="relative h-44 overflow-hidden rounded-[8px] bg-blue-50">
        {coverUrl ? <Image src={coverUrl} alt="Store cover" fill className="object-cover" unoptimized /> : null}
        <label className="absolute bottom-3 right-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] bg-white px-4 text-xs font-semibold shadow">
          <Camera size={16} />
          Cover
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => upload("cover", event.target.files?.[0])} />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative grid size-20 place-items-center overflow-hidden rounded-[8px] bg-blue-50 text-[var(--brand)]">
          {logoUrl ? <Image src={logoUrl} alt="Store logo" fill className="object-cover" unoptimized /> : <Camera size={24} />}
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] px-4 text-xs font-semibold">
          <Camera size={16} />
          Logo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => upload("logo", event.target.files?.[0])} />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Store name
          <input name="name" defaultValue={store?.name ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Store phone
          <input name="phone" defaultValue={store?.phone ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          WhatsApp number
          <input name="whatsapp" defaultValue={store?.whatsapp ?? store?.phone ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Location
          <input name="location" defaultValue={store?.location ?? "Dunkwa-on-Offin"} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Area
          <select name="area" defaultValue={store?.area ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
            <option value="">Choose area</option>
            {dunkwaAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Store address or map area
          <input name="address" defaultValue={store?.address ?? ""} placeholder="Near Dunkwa Market..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Opening hours
          <input name="openingHours" defaultValue={store?.openingHours ?? ""} placeholder="Mon-Sat, 8am-6pm" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
        Description
        <textarea name="description" defaultValue={store?.description ?? ""} rows={4} className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </label>
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-5">
        <Save size={17} />
        {pending ? "Saving..." : "Save store"}
      </Button>
    </form>
  );
}
