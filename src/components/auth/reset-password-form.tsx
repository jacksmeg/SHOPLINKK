"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("The new passwords do not match.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
        }),
      });

      if (response.ok) {
        setMessage("Password updated. You can sign in now.");
        setTimeout(() => router.push("/login"), 900);
        return;
      }

      const data = await response.json().catch(() => null);
      setMessage(data?.message ?? "Reset link is invalid or expired.");
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-[var(--ink)]">New password</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose a secure password.</p>
      <form method="post" onSubmit={submit} className="mt-6 grid gap-4">
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
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Link href="/login" className="mt-5 inline-flex text-sm font-bold text-[var(--brand-dark)]">
        Back to login
      </Link>
    </div>
  );
}
