"use client";

import { AlertCircle, ArrowRight, KeyRound, Loader2, Phone, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type SetupState = {
  username?: string | null;
  phone?: string | null;
  role?: "BUYER" | "SELLER" | "RIDER" | "ADMIN";
  needsUsername: boolean;
  needsPassword: boolean;
};

export function CompleteAuthFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status, update } = useSession();
  const [message, setMessage] = useState("Finishing your account...");
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const roleParam = params.get("role");
  const requestedRole = roleParam === "SELLER" ? "SELLER" : roleParam === "RIDER" ? "RIDER" : "BUYER";
  const requestedStoreKind = params.get("storeKind") === "FOOD" ? "FOOD" : "GENERAL";
  const callback = params.get("callback");
  const safeCallback = callback?.startsWith("/") ? callback : null;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (session?.user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    let active = true;
    async function finishAccount() {
      const accountResponse = await fetch("/api/account/onboarding", { cache: "no-store" });
      const account = await accountResponse.json().catch(() => null) as SetupState | null;
      if (!active) return;

      if (!accountResponse.ok || !account) {
        setMessage("We could not read your account setup. Please refresh and try again.");
        return;
      }

      if (account.needsUsername || account.needsPassword) {
        setSetup(account);
        setMessage("Complete your ShopLinkk account.");
        return;
      }

      if ((requestedRole === "SELLER" && session?.user.role !== "SELLER") || (requestedRole === "RIDER" && session?.user.role !== "RIDER")) {
        setMessage(requestedRole === "RIDER" ? "Opening your rider application..." : "Opening your seller dashboard...");
        const sellerResponse = await fetch("/api/account/complete-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: requestedRole, storeKind: requestedStoreKind }),
        });

        if (!active) return;

        if (!sellerResponse.ok) {
          const result = await sellerResponse.json().catch(() => null);
          setMessage(result?.message ?? "We could not finish your seller account. Please try again.");
          return;
        }

        await update();
        router.replace(requestedRole === "RIDER" ? "/rider/profile" : "/seller");
        router.refresh();
        return;
      }

      await update();
      router.replace(safeCallback ?? (session?.user.role === "SELLER" ? "/seller" : session?.user.role === "RIDER" ? "/rider" : "/buyer"));
      router.refresh();
    }

    void finishAccount();
    return () => {
      active = false;
    };
  }, [requestedRole, router, safeCallback, session?.user.role, status, update]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (setup?.needsPassword && password !== confirmPassword) {
      setFormMessage("Passwords do not match.");
      return;
    }

    setFormMessage("");
    startTransition(async () => {
      const response = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password,
          phone: form.get("phone"),
          role: requestedRole,
          storeKind: requestedStoreKind,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFormMessage(result?.message ?? "Could not finish your account setup.");
        return;
      }

      await update();
      router.replace(
        result?.role === "SELLER" || requestedRole === "SELLER"
          ? "/seller"
          : result?.role === "RIDER" || requestedRole === "RIDER"
            ? "/rider/profile"
            : safeCallback ?? "/buyer",
      );
      router.refresh();
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      {setup ? (
        <form onSubmit={submit} className="w-full max-w-md rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-xl">
          <div className="grid size-11 place-items-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand)]">
            <UserRound size={20} />
          </div>
          <h1 className="mt-4 text-base font-black text-[var(--ink)]">Finish your ShopLinkk account</h1>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Choose your username and password so you can also sign in without Google.
          </p>
          <div className="mt-5 grid gap-3">
            {requestedRole === "SELLER" ? (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-black text-[var(--ink)]">
                  Seller type: {requestedStoreKind === "FOOD" ? "Food seller" : "Products and services"}
                </p>
                <p className="mt-1 text-[0.68rem] leading-5 text-[var(--muted)]">
                  You can change store details later in Store management.
                </p>
              </div>
            ) : null}
            <label className="text-xs font-bold text-[var(--ink)]">
              Username
              <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-blue-100">
                <UserRound size={16} className="text-[var(--muted)]" />
                <input name="username" required defaultValue={setup.username ?? ""} placeholder="jackstudios" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </label>
            {setup.needsPassword ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-[var(--ink)]">
                  Password
                  <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-blue-100">
                    <KeyRound size={16} className="text-[var(--muted)]" />
                    <input name="password" type="password" required minLength={8} placeholder="Password" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </label>
                <label className="text-xs font-bold text-[var(--ink)]">
                  Confirm
                  <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-blue-100">
                    <KeyRound size={16} className="text-[var(--muted)]" />
                    <input name="confirmPassword" type="password" required minLength={8} placeholder="Confirm" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </label>
              </div>
            ) : null}
            <label className="text-xs font-bold text-[var(--ink)]">
              Phone number
              <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-blue-100">
                <Phone size={16} className="text-[var(--muted)]" />
                <input name="phone" defaultValue={setup.phone ?? ""} placeholder="020 123 4567" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </label>
          </div>
          {formMessage ? (
            <p className="mt-4 flex items-start gap-2 rounded-[8px] bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={15} />
              {formMessage}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Saving..." : requestedRole === "SELLER" ? "Create seller account" : requestedRole === "RIDER" ? "Create rider account" : "Open account"}
            <ArrowRight size={16} />
          </Button>
        </form>
      ) : (
        <div className="w-full max-w-sm rounded-[8px] border border-[var(--line)] bg-white p-5 text-center shadow-xl">
          <Loader2 className="mx-auto animate-spin text-[var(--brand)]" size={24} />
          <h1 className="mt-4 text-sm font-black text-[var(--ink)]">ShopLinkk</h1>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{message}</p>
        </div>
      )}
    </main>
  );
}
