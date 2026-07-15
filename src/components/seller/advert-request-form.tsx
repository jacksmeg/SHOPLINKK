"use client";

import Image from "next/image";
import { AlertCircle, CheckCircle2, Megaphone, Sparkles, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import { advertTemplates } from "@/lib/promo-templates";

export function AdvertRequestForm({
  productId,
  productTitle,
  advertPackages = [],
}: {
  productId: string;
  productTitle: string;
  advertPackages?: { id: string; name: string; description?: string | null; price: number; currency: string; durationDays?: number | null; placement?: string | null }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function useTemplate(templateId: string) {
    const template = advertTemplates.find((item) => item.id === templateId);
    if (!template) return;
    if (imageUrls.length >= 8 && !imageUrls.includes(template.previewUrl)) {
      setSuccess(false);
      setMessage("Remove one advert photo before adding this template.");
      return;
    }
    setSelectedTemplateId(template.id);
    setSuccess(false);
    setMessage(`${template.name} selected. You can still upload your own finished flyer if you want.`);
    setImageUrls((current) => {
      if (current.includes(template.previewUrl)) return current;
      if (current.length >= 8) return current;
      return [template.previewUrl, ...current];
    });
  }

  async function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (imageUrls.length + files.length > 8) {
      setSuccess(false);
      setMessage("Upload up to 8 advert photos.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadImage(file, "advert"));
      }
      setImageUrls((current) => [...current, ...uploaded]);
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Advert photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage("");
    setSuccess(false);

    startTransition(async () => {
      const packageId = String(form.get("packageId") ?? "");
      const durationDays = Number(form.get("durationDays") || "7");
      const placement = String(form.get("placement") || "HOMEPAGE");
      const selectedTemplate = advertTemplates.find((item) => item.id === selectedTemplateId);
      const note = String(form.get("note") ?? "").trim();
      const response = await fetch(`/api/products/${productId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: placement === "MARKETPLACE" ? "MARKETPLACE" : "HOMEPAGE",
          packageId,
          headline: String(form.get("headline") ?? "").trim(),
          durationDays: Number.isFinite(durationDays) ? durationDays : 7,
          note: [selectedTemplate ? `Template: ${selectedTemplate.name} (${selectedTemplate.id})` : "", note].filter(Boolean).join("\n\n"),
          imageUrls,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message ?? "The advert request could not be sent.");
        return;
      }

      if (packageId) {
        const checkout = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId, boostRequestId: result?.id }),
        });
        const checkoutData = await checkout.json().catch(() => null);
        if (checkout.ok && checkoutData?.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
        setMessage(checkoutData?.message ?? "Advert request saved, but payment checkout could not start.");
        return;
      }

      setSuccess(true);
      setMessage("Advert request sent. Admin will confirm the fee before the advert can run.");
      router.refresh();
      formElement.reset();
      setImageUrls([]);
      setSelectedTemplateId("");
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <form onSubmit={submit} className="app-panel p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-[var(--ink)]">
          Advert placement
          <select name="placement" defaultValue="HOMEPAGE" className="form-control mt-1.5 w-full bg-white px-3 text-xs">
            <option value="HOMEPAGE">Homepage animated advert trail</option>
            <option value="MARKETPLACE">Featured marketplace placement</option>
          </select>
        </label>
        <label className="text-xs font-bold text-[var(--ink)]">
          Requested duration
          <select name="durationDays" defaultValue="7" className="form-control mt-1.5 w-full bg-white px-3 text-xs">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      {advertPackages.length ? (
        <label className="mt-4 block text-xs font-bold text-[var(--ink)]">
          Advert package
          <select name="packageId" className="form-control mt-1.5 w-full bg-white px-3 text-xs">
            <option value="">Let admin confirm the best fee</option>
            {advertPackages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - GH₵ {item.price.toFixed(2)}{item.durationDays ? ` / ${item.durationDays} days` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="mt-4 block text-xs font-bold text-[var(--ink)]">
        Advert headline
        <input
          name="headline"
          required
          minLength={4}
          maxLength={70}
          defaultValue={`Available now: ${productTitle}`}
          className="form-control mt-1.5 w-full px-3 text-xs"
        />
      </label>
      <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-[#fff7ed] p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 shrink-0 text-red-600" size={16} />
          <div>
            <p className="text-xs font-black text-slate-950">ShopLinkk advert templates</p>
            <p className="mt-1 text-[0.68rem] leading-5 text-slate-700">Use these red and yellow designs as advert or flash-sale creative styles. They will be attached as the first advert image.</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {advertTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => useTemplate(template.id)}
              className={`group overflow-hidden rounded-[8px] border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${selectedTemplateId === template.id ? "border-red-600 ring-2 ring-yellow-300" : "border-orange-200"}`}
            >
              <span className="relative block aspect-[16/9] bg-red-700">
                <Image src={template.previewUrl} alt={template.name} fill className="object-cover transition duration-500 group-hover:scale-[1.02]" unoptimized />
              </span>
              <span className="block p-3">
                <span className="block text-xs font-black text-slate-950">{template.name}</span>
                <span className="mt-1 block text-[0.68rem] leading-5 text-slate-600">{template.description}</span>
                <span className="mt-2 inline-flex rounded-full bg-yellow-300 px-2 py-1 text-[0.64rem] font-black text-slate-950">
                  {selectedTemplateId === template.id ? "Selected" : "Use template"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <label className="mt-4 block text-xs font-bold text-[var(--ink)]">
        Message to admin <span className="font-normal text-[var(--muted)]">(optional)</span>
        <textarea
          name="note"
          maxLength={500}
          rows={4}
          placeholder="Preferred start date, advert details, or payment discussion."
          className="form-control mt-1.5 w-full resize-none px-3 py-2 text-xs"
        />
      </label>
      <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[var(--ink)]">Advert photos</p>
            <p className="mt-1 text-[0.68rem] leading-5 text-[var(--muted)]">Recommended creative size: 1200 x 760 px. Upload up to 8 photos.</p>
          </div>
          <label className="uiverse-sheen button-sheen-blue inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-4 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">
            <UploadCloud size={15} />
            {uploading ? "Uploading..." : "Upload photos"}
            <input type="file" accept="image/*" multiple disabled={uploading || imageUrls.length >= 8} onChange={handleImages} className="hidden" />
          </label>
        </div>
        {imageUrls.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-[120/76] overflow-hidden rounded-[7px] border border-[var(--line)] bg-[var(--surface-muted)]">
                <Image src={url} alt={`Advert creative ${index + 1}`} fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/95 text-red-600 opacity-100 shadow-sm transition hover:scale-105 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove advert photo ${index + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-4 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs leading-5 text-[var(--brand-dark)]">
        Admin will review your advert creative, confirm the offline fee, and choose when the campaign should go live.
      </p>
      {message ? (
        <p className={`mt-4 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${success ? "bg-blue-50 text-[var(--brand-dark)]" : "bg-red-50 text-red-700"}`}>
          {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={15} /> : <AlertCircle className="mt-0.5 shrink-0" size={15} />}
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || uploading || success} className="mt-5">
        <Megaphone size={16} />
        {pending ? "Sending..." : success ? "Request sent" : "Request advert"}
      </Button>
    </form>
  );
}
