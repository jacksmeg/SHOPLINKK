"use client";

import Image from "next/image";
import { Camera, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/components/forms/upload-helper";

export function CategoryForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          icon: imageUrl || formData.get("icon"),
        }),
      });
      setMessage(response.ok ? "Category created." : "Could not create category.");
      if (response.ok) { event.currentTarget.reset(); setImageUrl(""); }
      router.refresh();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[var(--ink)]">Add category</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
        <input name="name" required placeholder="Name" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="description" placeholder="Description" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="icon" placeholder="Lucide icon" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <Button type="submit" disabled={pending}>
          <Plus size={16} />
          Add
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] p-3">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[7px] bg-white text-[var(--muted)]">
          {imageUrl ? <Image src={imageUrl} alt="Category preview" fill className="object-cover" unoptimized /> : <Camera size={20} />}
        </div>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--ink)]">Category photo</p><p className="mt-1 text-[0.68rem] leading-5 text-[var(--muted)]">Recommended: 900 x 700 px. The image will be prepared for the category tile.</p></div>
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--brand-dark)]"><Camera size={14} /> {uploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); setMessage("Uploading category image..."); try { setImageUrl(await uploadImage(file, "category")); setMessage("Category image uploaded. Add the category to save it."); } catch (error) { setMessage(error instanceof Error ? error.message : "Category image upload failed"); } finally { setUploading(false); } }} /></label>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}
