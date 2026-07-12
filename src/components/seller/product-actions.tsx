"use client";

import Link from "next/link";
import { Copy, Eye, PackageCheck, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AdvertRequestButton } from "@/components/seller/advert-request-button";

export function SellerProductActions({
  productId,
  productSlug,
  productTitle,
  approved,
}: {
  productId: string;
  productSlug: string;
  productTitle: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: "duplicate" | "sold" | "renew") {
    startTransition(async () => {
      await fetch(`/api/products/${productId}/${action}`, { method: "POST" });
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Remove this listing from ShopLinkk?")) return;
    startTransition(async () => {
      await fetch(`/api/products/${productId}`, { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/seller/products/${productId}/edit`} className="inline-flex min-h-9 items-center rounded-[7px] border border-[var(--line)] px-3 text-xs font-semibold text-[var(--brand-dark)]">
        Edit
      </Link>
      {approved ? (
        <Link href={`/products/${productSlug}`} className="inline-flex min-h-9 items-center gap-1 rounded-[7px] border border-[var(--line)] px-3 text-xs font-semibold text-[var(--brand-dark)]">
          <Eye size={14} />
          View
        </Link>
      ) : null}
      <Button type="button" variant="secondary" disabled={pending} onClick={() => run("duplicate")} className="min-h-9 px-3 text-xs">
        <Copy size={14} />
        Duplicate
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => run("sold")} className="min-h-9 px-3 text-xs">
        <PackageCheck size={14} />
        Sold
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => run("renew")} className="min-h-9 px-3 text-xs">
        <RefreshCw size={14} />
        Renew
      </Button>
      <Button type="button" variant="danger" disabled={pending} onClick={remove} className="min-h-9 px-3 text-xs">
        <Trash2 size={14} />
        Delete
      </Button>
      {approved ? (
        <AdvertRequestButton productId={productId} productTitle={productTitle} />
      ) : null}
    </div>
  );
}
