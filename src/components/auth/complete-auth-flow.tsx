"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CompleteAuthFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status, update } = useSession();
  const [message, setMessage] = useState("Finishing your account...");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const requestedRole = params.get("role") === "SELLER" ? "SELLER" : "BUYER";
    if (session?.user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    if (requestedRole === "BUYER") {
      router.replace("/buyer");
      return;
    }

    let active = true;
    async function finishSellerAccount() {
      setMessage("Opening your seller dashboard...");
      const response = await fetch("/api/account/complete-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "SELLER" }),
      });

      if (!active) return;

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setMessage(result?.message ?? "We could not finish your seller account. Please try again.");
        return;
      }

      await update();
      router.replace("/seller");
      router.refresh();
    }

    void finishSellerAccount();
    return () => {
      active = false;
    };
  }, [params, router, session?.user.role, status, update]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <div className="w-full max-w-sm rounded-[8px] border border-[var(--line)] bg-white p-5 text-center shadow-xl">
        <Loader2 className="mx-auto animate-spin text-[var(--brand)]" size={24} />
        <h1 className="mt-4 text-sm font-black text-[var(--ink)]">ShopLinkk</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{message}</p>
      </div>
    </main>
  );
}
