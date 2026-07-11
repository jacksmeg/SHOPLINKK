"use client";

import { Send } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("email"), message: data.get("message") }) });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Your message has been sent. We will get back to you soon." : result?.message ?? "Your message could not be sent.");
      if (response.ok) form.reset();
    });
  }

  return (
    <form method="post" onSubmit={submit} className="app-panel p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[var(--ink)]">Name<input name="name" required autoComplete="name" className="form-control mt-1.5 w-full px-3" /></label><label className="text-xs font-semibold text-[var(--ink)]">Email<input name="email" required type="email" autoComplete="email" className="form-control mt-1.5 w-full px-3" /></label></div>
      <label className="mt-3 block text-xs font-semibold text-[var(--ink)]">Message<textarea name="message" required rows={6} className="form-control mt-1.5 w-full resize-y px-3 py-2" /></label>
      <div className="mt-4 flex items-center gap-3"><Button type="submit" disabled={pending}><Send size={15} /> {pending ? "Sending..." : "Send message"}</Button>{message ? <p className="text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}</div>
    </form>
  );
}
