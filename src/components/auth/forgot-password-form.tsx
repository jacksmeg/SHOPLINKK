"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });

      const data = await response.json().catch(() => null);
      setMessage(data?.message ?? "If the email exists, reset instructions will be sent.");
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-[var(--ink)]">Reset password</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Enter your email to continue.</p>
      <form method="post" onSubmit={submit} className="mt-6 grid gap-4">
        <label className="text-sm font-bold text-[var(--ink)]">
          Email
          <span className="relative mt-2 block">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input name="email" type="email" required className="min-h-12 w-full rounded-[8px] border border-[var(--line)] pl-10 pr-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </span>
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending..." : "Send reset instructions"}
        </Button>
      </form>
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Link href="/login" className="mt-5 inline-flex text-sm font-bold text-[var(--brand-dark)]">
        Back to login
      </Link>
    </div>
  );
}
