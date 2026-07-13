"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export function ProductShareActions({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} on ShopLinkk`);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({ title, text: `Check ${title} on ShopLinkk`, url }).catch(() => null);
      return;
    }

    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(url).catch(() => null);
    setCopied(true);
  }

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-[var(--ink)]">Share this listing</p>
        {copied ? <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[var(--brand-dark)]"><Check size={13} /> Copied</span> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button type="button" variant="primary" onClick={shareNative} className="w-full">
          <Share2 size={15} />
          Share
        </Button>
        <Button type="button" variant="secondary" onClick={copyLink} className="w-full">
          <Copy size={15} />
          Copy
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
