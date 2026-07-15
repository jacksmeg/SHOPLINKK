"use client";

import Image from "next/image";
import { ImagePlus, PauseCircle, PlayCircle, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import type { AdminImageAdvert } from "@/lib/admin-advert-types";
import { compactDate } from "@/lib/utils";

export function AdminImageAdvertForm({ initialAdverts }: { initialAdverts: AdminImageAdvert[] }) {
  const router = useRouter();
  const [adverts, setAdverts] = useState(initialAdverts);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadImage(file, "advert");
      setImageUrl(uploaded);
      setMessage("Advert image uploaded. Add a duration and post it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Advert upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl) {
      setMessage("Upload the advert image first.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/image-adverts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: String(data.get("headline") ?? ""),
          href: String(data.get("href") ?? ""),
          durationDays: Number(data.get("durationDays") || 7),
          imageUrl,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not post admin advert.");
        return;
      }
      setAdverts((current) => [result.advert, ...current]);
      setImageUrl("");
      form.reset();
      setMessage("Admin image advert is live on the homepage.");
      router.refresh();
    });
  }

  function updateAdvert(id: string, isActive: boolean) {
    startTransition(async () => {
      const response = await fetch("/api/admin/image-adverts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setMessage(result?.message ?? "Advert could not be updated.");
        return;
      }
      setAdverts((current) => current.map((advert) => advert.id === id ? { ...advert, isActive } : advert));
      setMessage(isActive ? "Advert resumed." : "Advert paused.");
      router.refresh();
    });
  }

  function deleteAdvert(id: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/image-adverts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setMessage(result?.message ?? "Advert could not be deleted.");
        return;
      }
      setAdverts((current) => current.filter((advert) => advert.id !== id));
      setMessage("Advert deleted.");
      router.refresh();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <section className="mb-4 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><ImagePlus size={17} /> Admin image advert</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Post a homepage advert using only an uploaded flyer image. No seller product is required.</p>
        </div>
        <span className="rounded-full bg-red-600 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white">Image only</span>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 lg:grid-cols-[240px_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)]">
          {imageUrl ? <Image src={imageUrl} alt="Admin advert preview" fill className="object-cover" unoptimized /> : (
            <div className="grid h-full place-items-center p-4 text-center text-xs font-semibold text-[var(--muted)]">Upload flyer image</div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-[var(--ink)]">Headline <span className="font-normal text-[var(--muted)]">(optional)</span><input name="headline" maxLength={90} placeholder="Flash deals this week" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Click link <span className="font-normal text-[var(--muted)]">(optional)</span><input name="href" maxLength={300} placeholder="/marketplace or https://..." className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          <label className="text-xs font-bold text-[var(--ink)]">Run for<select name="durationDays" defaultValue="7" className="form-control mt-1.5 w-full bg-white px-3 text-xs"><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-4 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">
              <UploadCloud size={15} />
              {uploading ? "Uploading..." : "Upload image"}
              <input type="file" accept="image/*" disabled={uploading} onChange={handleImage} className="hidden" />
            </label>
            <Button type="submit" disabled={pending || uploading}>{pending ? "Posting..." : "Post advert"}</Button>
          </div>
        </div>
      </form>
      {message ? <p className="mt-3 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}

      {adverts.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adverts.map((advert) => (
            <article key={advert.id} className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)]">
              <div className="relative aspect-[16/9] bg-white">
                <Image src={advert.imageUrl} alt={advert.headline} fill className="object-cover" unoptimized />
                <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[0.64rem] font-black uppercase ${advert.isActive ? "bg-green-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {advert.isActive ? "Live" : "Paused"}
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-xs font-black text-[var(--ink)]">{advert.headline}</p>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">Ends {compactDate(advert.endsAt)}</p>
                {advert.href ? <p className="mt-1 truncate text-[0.68rem] font-semibold text-[var(--brand-dark)]">{advert.href}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" disabled={pending} onClick={() => updateAdvert(advert.id, !advert.isActive)} className="min-h-8 px-3">
                    {advert.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    {advert.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button type="button" variant="danger" disabled={pending} onClick={() => deleteAdvert(advert.id)} className="min-h-8 px-3">
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
