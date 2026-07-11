"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function ReviewForm({
  sellerId,
  storeId,
  productId,
}: {
  sellerId: string;
  storeId?: string;
  productId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          storeId,
          productId,
          rating: formData.get("rating"),
          comment: formData.get("comment"),
        }),
      });

      setMessage(response.ok ? "Review saved. Thank you." : "Could not save review.");
      if (response.ok) {
        event.currentTarget.reset();
      }
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
      <h3 className="font-black text-[var(--ink)]">Review this seller</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <select name="rating" defaultValue="5" className="min-h-11 rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} stars
            </option>
          ))}
        </select>
        <input name="comment" placeholder="Share a short buying experience" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <Button type="submit" disabled={pending}>
          <Star size={16} />
          Save
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}
