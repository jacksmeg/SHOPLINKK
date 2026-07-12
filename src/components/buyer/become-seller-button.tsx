"use client";

import { AlertCircle, ArrowRight, ShieldCheck, Store } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export function BecomeSellerButton({ verified }: { verified: boolean }) {
  const router = useRouter();
  const { update } = useSession();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!verified) {
    return (
      <ButtonLink href="/account/security" variant="secondary">
        <ShieldCheck size={16} />
        Verify account to sell
      </ButtonLink>
    );
  }

  function becomeSeller() {
    startTransition(async () => {
      setMessage("");
      try {
        const response = await fetch("/api/account/become-seller", { method: "POST" });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage(result?.message ?? "We could not open your seller account.");
          return;
        }

        await update();
        router.replace("/seller");
        router.refresh();
      } catch {
        setMessage("We could not reach ShopLinkk. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={becomeSeller} disabled={pending}>
        <Store size={16} />
        {pending ? "Opening seller account..." : "Become a seller"}
        <ArrowRight size={16} />
      </Button>
      {message ? <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700"><AlertCircle size={14} />{message}</p> : null}
    </div>
  );
}
