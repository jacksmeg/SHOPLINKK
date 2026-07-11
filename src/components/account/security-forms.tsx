"use client";

import { KeyRound, Mail, Phone, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type SecurityFormsProps = {
  email?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export function SecurityForms({ email, phone, emailVerified, phoneVerified }: SecurityFormsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  function post(path: string, data?: Record<string, FormDataEntryValue | string | null>) {
    startTransition(async () => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      });
      const result = await response.json().catch(() => null);
      setMessage(result?.message ?? (response.ok ? "Done." : "Could not complete this action."));
      setMessageIsError(!response.ok);
      router.refresh();
    });
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    post("/api/account/change-password", {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    });
  }

  function requestEmailVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    post("/api/account/email/request-verification", { email: formData.get("email") });
  }

  function requestPhoneVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    post("/api/account/phone/request-otp", { phone: formData.get("phone") });
  }

  function verifyPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    post("/api/account/phone/verify", { code: formData.get("code") });
  }

  function deleteRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    post("/api/account/delete-request", { reason: formData.get("reason") });
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <p className={`rounded-[8px] p-3 text-sm font-bold ${messageIsError ? "bg-red-50 text-red-700" : "bg-blue-50 text-[var(--brand-dark)]"}`}>
          {message}
        </p>
      ) : null}

      <section className="rounded-[8px] border border-[var(--line)] bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-0.5 text-[var(--brand)]" size={19} />
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Verify your contact details</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Use your own email address and Ghana phone number. You can verify either one at any time.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          <form method="post" onSubmit={requestEmailVerification} className="p-5 md:border-r md:border-[var(--line)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><Mail size={17} /> Email verification</h3>
              <span className={`text-xs font-bold ${emailVerified ? "text-[var(--brand)]" : "text-cyan-800"}`}>{emailVerified ? "Verified" : "Not verified"}</span>
            </div>
            <label className="mt-4 block text-xs font-semibold text-[var(--ink)]">
              Email address
              <input name="email" type="email" defaultValue={email ?? ""} required autoComplete="email" className="form-control mt-1.5 w-full px-3 text-sm" />
            </label>
            <Button type="submit" disabled={pending} variant="secondary" className="mt-4">
              <Mail size={16} />
              {pending ? "Sending..." : "Send verification email"}
            </Button>
          </form>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><Phone size={17} /> Phone verification</h3>
              <span className={`text-xs font-bold ${phoneVerified ? "text-[var(--brand)]" : "text-cyan-800"}`}>{phoneVerified ? "Verified" : "Not verified"}</span>
            </div>
            <form method="post" onSubmit={requestPhoneVerification} className="mt-4">
              <label className="block text-xs font-semibold text-[var(--ink)]">
                Ghana phone number
                <input name="phone" type="tel" inputMode="tel" defaultValue={phone ?? ""} required placeholder="024 000 0000" autoComplete="tel" className="form-control mt-1.5 w-full px-3 text-sm" />
              </label>
              <Button type="submit" disabled={pending} variant="secondary" className="mt-4">
                <Phone size={16} />
                {pending ? "Sending..." : "Send SMS code"}
              </Button>
            </form>
            <form method="post" onSubmit={verifyPhone} className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
              <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" required className="form-control min-w-[138px] flex-1 px-3 text-sm" />
              <Button type="submit" disabled={pending}>Verify code</Button>
            </form>
          </div>
        </div>
      </section>

      <form method="post" onSubmit={changePassword} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><KeyRound size={18} /> Change password</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="currentPassword" type="password" placeholder="Current password" required className="form-control w-full px-3 text-sm" />
          <input name="newPassword" type="password" placeholder="New password" required className="form-control w-full px-3 text-sm" />
        </div>
        <Button type="submit" disabled={pending} className="mt-4">Save password</Button>
      </form>

      <form method="post" onSubmit={deleteRequest} className="rounded-[8px] border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-black text-red-700"><Trash2 size={18} /> Delete account request</h2>
        <textarea name="reason" rows={3} placeholder="Optional reason" className="mt-4 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" />
        <Button type="submit" variant="danger" disabled={pending} className="mt-4">Request account deletion</Button>
      </form>
    </div>
  );
}
