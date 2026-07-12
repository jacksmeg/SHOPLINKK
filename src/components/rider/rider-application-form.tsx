"use client";

import { Camera, CheckCircle2, FileBadge, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";

type RiderApplication = {
  profilePhotoUrl?: string | null;
  ghanaCardUrl?: string | null;
  licenseUrl?: string | null;
  vehicleDocumentUrl?: string | null;
  vehicleType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  momoName?: string | null;
  momoNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  status?: string | null;
};

const uploadFields = [
  { key: "profilePhotoUrl", label: "Profile picture", icon: Camera },
  { key: "ghanaCardUrl", label: "Ghana Card", icon: FileBadge },
  { key: "licenseUrl", label: "Driver's license", icon: FileBadge },
  { key: "vehicleDocumentUrl", label: "Motor/car document", icon: FileBadge },
] as const;

export function RiderApplicationForm({ profile }: { profile?: RiderApplication | null }) {
  const router = useRouter();
  const [values, setValues] = useState({
    profilePhotoUrl: profile?.profilePhotoUrl ?? "",
    ghanaCardUrl: profile?.ghanaCardUrl ?? "",
    licenseUrl: profile?.licenseUrl ?? "",
    vehicleDocumentUrl: profile?.vehicleDocumentUrl ?? "",
  });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState("");
  const [pending, startTransition] = useTransition();

  async function upload(field: keyof typeof values, file?: File | null) {
    if (!file) return;
    setMessage("");
    setUploading(field);
    try {
      const url = await uploadImage(file, field === "profilePhotoUrl" ? "profile" : "rider-document");
      setValues((current) => ({ ...current, [field]: url }));
      setMessage("Upload complete. Submit the application when ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading("");
    }
  }

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/rider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePhotoUrl: values.profilePhotoUrl,
          ghanaCardUrl: values.ghanaCardUrl,
          licenseUrl: values.licenseUrl,
          vehicleDocumentUrl: values.vehicleDocumentUrl,
          vehicleType: formData.get("vehicleType"),
          emergencyContactName: formData.get("emergencyContactName"),
          emergencyContactPhone: formData.get("emergencyContactPhone"),
          momoName: formData.get("momoName"),
          momoNumber: formData.get("momoNumber"),
          bankName: formData.get("bankName"),
          bankAccountName: formData.get("bankAccountName"),
          bankAccountNumber: formData.get("bankAccountNumber"),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not submit rider application.");
        return;
      }
      setMessage("Rider application submitted. Admin will review your documents.");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {uploadFields.map((field) => {
          const Icon = field.icon;
          const uploaded = Boolean(values[field.key]);
          return (
            <label key={field.key} className="group grid min-h-36 cursor-pointer place-items-center rounded-[10px] border border-[var(--line)] bg-white p-4 text-center transition hover:border-[var(--brand)] hover:shadow-sm">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => void upload(field.key, event.target.files?.[0])} />
              <span className={`grid size-11 place-items-center rounded-[10px] ${uploaded ? "bg-emerald-50 text-emerald-700" : "bg-[var(--brand-soft)] text-[var(--brand-dark)]"}`}>
                {uploading === field.key ? <LoaderCircle className="animate-spin" size={18} /> : uploaded ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </span>
              <span className="mt-3 block text-xs font-black text-[var(--ink)]">{field.label}</span>
              <span className="mt-1 block text-[0.68rem] leading-4 text-[var(--muted)]">{uploaded ? "Uploaded" : "Tap to upload"}</span>
            </label>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Vehicle and emergency contact</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-bold text-[var(--ink)]">
              Vehicle type
              <select name="vehicleType" defaultValue={profile?.vehicleType ?? "MOTORCYCLE"} className="form-control mt-1.5 w-full bg-white px-3 text-xs">
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="TRICYCLE">Tricycle</option>
                <option value="CAR">Car</option>
                <option value="VAN">Van</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[var(--ink)]">
              Emergency contact name
              <input name="emergencyContactName" defaultValue={profile?.emergencyContactName ?? ""} required className="form-control mt-1.5 w-full px-3 text-xs" />
            </label>
            <label className="text-xs font-bold text-[var(--ink)]">
              Emergency contact phone
              <input name="emergencyContactPhone" defaultValue={profile?.emergencyContactPhone ?? ""} required placeholder="024 000 0000" className="form-control mt-1.5 w-full px-3 text-xs" />
            </label>
          </div>
        </section>

        <section className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Future payout details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[var(--ink)]">MoMo name<input name="momoName" defaultValue={profile?.momoName ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">MoMo number<input name="momoNumber" defaultValue={profile?.momoNumber ?? ""} placeholder="024 000 0000" className="form-control mt-1.5 w-full px-3 text-xs" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Bank name<input name="bankName" defaultValue={profile?.bankName ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Account name<input name="bankAccountName" defaultValue={profile?.bankAccountName ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
            <label className="text-xs font-bold text-[var(--ink)] sm:col-span-2">Account number<input name="bankAccountNumber" defaultValue={profile?.bankAccountNumber ?? ""} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
          </div>
        </section>
      </div>

      {message ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-bold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending || Boolean(uploading)} className="w-full sm:w-fit">
        <UploadCloud size={16} />
        {pending ? "Submitting..." : "Submit rider application"}
      </Button>
    </form>
  );
}
