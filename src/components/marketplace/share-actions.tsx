"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export function ShareActions({
  heading,
  title,
  url,
}: {
  heading: string;
  title: string;
  url: string;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} on ShopLinkk`);

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 5000);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check ${title} on ShopLinkk`, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
    }
  }

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[var(--ink)]">{heading}</h2>
        <span role="status" className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-dark)]">
          {copyStatus === "copied" ? <><Check size={13} /> Link copied</> : null}
          {copyStatus === "manual" ? "Copy the link below" : null}
        </span>
      </div>
      {copyStatus === "manual" ? (
        <input
          aria-label="Link to copy"
          className="mt-2 w-full rounded-[7px] border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)]"
          value={url}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button type="button" variant="primary" onClick={shareNative} className="w-full">
          <Share2 size={15} />
          Share
        </Button>
        <Button type="button" variant="secondary" onClick={copyLink} className="w-full">
          <Copy size={15} />
          Copy link
        </Button>
        <ButtonLink href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" variant="secondary" className="w-full">
          <MessageCircle size={15} />
          WhatsApp
        </ButtonLink>
        <ButtonLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" variant="secondary" className="w-full">
          <Share2 size={15} />
          Facebook
        </ButtonLink>
      </div>
      <ButtonLink href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" variant="ghost" className="mt-2 w-full">
        Share on X
      </ButtonLink>
    </div>
  );
}
