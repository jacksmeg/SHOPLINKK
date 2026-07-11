"use client";

import Image from "next/image";
import { Camera, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/components/forms/upload-helper";
import { dunkwaAreas } from "@/lib/ghana";

type Profile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  area?: string | null;
  bio?: string | null;
  image?: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [image, setImage] = useState(profile.image ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleFile(file?: File) {
    if (!file) return;
    setMessage("Uploading photo...");
    try {
      setImage(await uploadImage(file, "profile"));
      setMessage("Photo uploaded. Save profile to keep it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          whatsapp: formData.get("whatsapp"),
          location: formData.get("location"),
          area: formData.get("area"),
          bio: formData.get("bio"),
          image,
        }),
      });

      setMessage(response.ok ? "Profile saved." : "Could not save profile.");
      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid size-24 place-items-center overflow-hidden rounded-full bg-blue-50 text-[var(--brand)]">
          {image ? <Image src={image} alt="Profile photo" fill className="object-cover" unoptimized /> : <Camera size={28} />}
        </div>
        <div>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-4 text-xs font-semibold transition hover:border-[var(--brand)]">
            <Camera size={17} />
            Upload photo
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile.email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Name
          <input name="name" defaultValue={profile.name ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Phone
          <input name="phone" defaultValue={profile.phone ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          WhatsApp
          <input name="whatsapp" defaultValue={profile.whatsapp ?? profile.phone ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Location
          <input name="location" defaultValue={profile.location ?? "Dunkwa-on-Offin"} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Area
          <select name="area" defaultValue={profile.area ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
            <option value="">Choose area</option>
            {dunkwaAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
        Bio
        <textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </label>
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-5">
        <Save size={17} />
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
