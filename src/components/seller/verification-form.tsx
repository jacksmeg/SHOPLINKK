"use client";

import { BadgeCheck, FileImage, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";

export function VerificationForm({ defaultName }: { defaultName?: string | null }) {
  const router = useRouter();
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function uploadDocument(file?: File) {
    if (!file) return;
    setMessage("Uploading document photo...");
    try {
      setDocumentUrl(await uploadImage(file, "seller-document"));
      setDocumentName(file.name);
      setMessage("Document uploaded. Submit the request when ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document upload failed.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/seller/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.get("businessName"),
          documentUrl,
          notes: formData.get("notes"),
        }),
      });
      setMessage(response.ok ? "Verification request submitted." : "Could not submit verification.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-black text-[var(--ink)]"><BadgeCheck size={18} /> Seller verification</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="businessName" defaultValue={defaultName ?? ""} required placeholder="Business/store name" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-[var(--line)] px-3 text-xs font-semibold text-[var(--brand-dark)] transition hover:border-[var(--brand)]">
          <FileImage size={16} />
          {documentName || "Upload ID or business document"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadDocument(event.target.files?.[0])} />
        </label>
      </div>
      {documentUrl ? <div className="mt-3 flex items-center justify-between gap-3 rounded-[7px] bg-blue-50 px-3 py-2 text-xs font-semibold text-[var(--brand-dark)]"><span className="truncate">{documentName || "Document ready"}</span><button type="button" onClick={() => { setDocumentUrl(""); setDocumentName(""); }} aria-label="Remove document"><X size={15} /></button></div> : null}
      <textarea name="notes" rows={3} placeholder="Tell admin how to verify your business" className="mt-3 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      <Button type="submit" disabled={pending} className="mt-4">Submit verification</Button>
      {message ? <p className="mt-3 text-sm font-bold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}
