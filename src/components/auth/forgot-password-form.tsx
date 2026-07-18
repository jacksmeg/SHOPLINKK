"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Phone, ShieldCheck } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [phoneReset, setPhoneReset] = useState<{ phone: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage("");
    setMessageIsError(false);

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.get("identifier") }),
      });

      const data = await response.json().catch(() => null);
      setMessage(data?.message ?? "If the account exists, reset instructions will be sent.");
      setMessageIsError(!response.ok);
      if (response.ok && data?.resetMode === "phone" && data?.phone) {
        setPhoneReset({ phone: data.phone });
      }
    });
  }

  function resetWithPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    setMessage("");
    setMessageIsError(false);

    if (password !== confirmPassword) {
      setMessage("The new passwords do not match.");
      setMessageIsError(true);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneReset?.phone,
          code: formData.get("code"),
          password,
        }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setMessage(data?.message ?? "Password updated. You can sign in now.");
        setMessageIsError(false);
        setTimeout(() => router.push("/login"), 900);
        return;
      }

      setMessage(data?.message ?? "Code is invalid or expired.");
      setMessageIsError(true);
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-[var(--ink)]">Reset password</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use your email, username, or Ghana phone number.</p>
      <form method="post" onSubmit={submit} className="mt-6 grid gap-4">
        <label className="text-sm font-bold text-[var(--ink)]">
          Email, username, or phone
          <span className="relative mt-2 block">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input name="identifier" type="text" required autoComplete="username" placeholder="email, username, or 024..." className="min-h-12 w-full rounded-[8px] border border-[var(--line)] pl-10 pr-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </span>
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending..." : "Send reset instructions"}
        </Button>
      </form>
      {phoneReset ? (
        <form method="post" onSubmit={resetWithPhone} className="mt-5 grid gap-4 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 text-[var(--brand)]" size={18} />
            <div>
              <p className="text-sm font-black text-[var(--ink)]">Enter the SMS code</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Code sent to {phoneReset.phone}. Choose your new password below.</p>
            </div>
          </div>
          <label className="text-sm font-bold text-[var(--ink)]">
            6-digit code
            <span className="relative mt-2 block">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required className="min-h-12 w-full rounded-[8px] border border-[var(--line)] pl-10 pr-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </span>
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            New password
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input name="password" type="password" minLength={8} required className="min-h-12 w-full rounded-[8px] border border-[var(--line)] pl-10 pr-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </span>
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            Confirm password
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input name="confirmPassword" type="password" minLength={8} required className="min-h-12 w-full rounded-[8px] border border-[var(--line)] pl-10 pr-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </span>
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      ) : null}
      {message ? <p className={`mt-4 rounded-[8px] p-3 text-sm font-semibold ${messageIsError ? "bg-red-50 text-red-700" : "bg-blue-50 text-[var(--brand-dark)]"}`}>{message}</p> : null}
      <Link href="/login" className="mt-5 inline-flex text-sm font-bold text-[var(--brand-dark)]">
        Back to login
      </Link>
    </div>
  );
}
