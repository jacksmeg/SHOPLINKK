"use client";

import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail, MapPin, Phone, ShoppingBag, Store, Truck, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { AuthPanel, GoogleIcon } from "@/components/auth/auth-panel";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RegisterForm({ googleEnabled, turnstileSiteKey }: { googleEnabled: boolean; turnstileSiteKey?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role")?.toLowerCase();
  const requestedKind = searchParams.get("storeKind")?.toLowerCase();
  const [role, setRole] = useState<"BUYER" | "SELLER" | "RIDER">(
    requestedRole === "seller" ? "SELLER" : requestedRole === "rider" ? "RIDER" : "BUYER",
  );
  const [storeKind, setStoreKind] = useState<"GENERAL" | "FOOD">(requestedKind === "food" ? "FOOD" : "GENERAL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [pending, startTransition] = useTransition();
  const securityEnabled = Boolean(turnstileSiteKey);

  function resetSecurityCheck() {
    setTurnstileToken("");
    setTurnstileReset((value) => value + 1);
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    setError("");
    setSuccess("");

    if (!accepted) {
      setError("Tick the agreement box before creating your account.");
      return;
    }

    if (securityEnabled && !turnstileToken) {
      setError("Complete the Cloudflare security check before creating your account.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") ?? "").trim(),
            username,
            email,
            password,
            phone: String(formData.get("phone") ?? "").trim(),
            location: String(formData.get("location") ?? "").trim(),
            role,
            storeKind: role === "SELLER" ? storeKind : "GENERAL",
            termsAccepted: true,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.message ?? "Could not create account.");
          resetSecurityCheck();
          return;
        }

        const created = await response.json().catch(() => null);
        if (created?.requiresVerification) {
          router.push("/login?registered=verify");
          return;
        }

        setSuccess("Account created. Signing you in...");
        const login = await signIn("credentials", {
          redirect: false,
          identifier: email,
          password,
          loginGuard: created?.loginGuard ?? "",
          termsAccepted: "true",
          callbackUrl: role === "SELLER" ? "/seller" : role === "RIDER" ? "/rider/profile" : "/buyer",
        });

        if (!login || login.error) {
          setError("Your account is ready, but automatic sign-in did not finish. Use the same email and password on the login page.");
          resetSecurityCheck();
          return;
        }

        const session = await getSession();
        if (!session?.user?.id) {
          setError("Your account is ready, but the session could not start. Use the same email and password on the login page.");
          return;
        }

        router.replace(role === "SELLER" ? "/seller" : role === "RIDER" ? "/rider/profile" : "/buyer");
        router.refresh();
      } catch {
        setError("We could not reach ShopLinkk just now. Check your connection and try again.");
      }
    });
  }

  return (
    <AuthPanel mode="register">
      <div>
        <h1 className="text-xl font-black text-[var(--ink)]">Create account</h1>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Choose how you want to join.</p>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-[7px] border border-[var(--line)] bg-white p-1">
          {[
            { value: "BUYER" as const, label: "Buyer", icon: ShoppingBag },
            { value: "SELLER" as const, label: "Seller", icon: Store },
            { value: "RIDER" as const, label: "Rider", icon: Truck },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRole(item.value)}
              className={cn(
                "inline-flex min-h-9 items-center justify-center gap-2 rounded-[6px] text-xs font-semibold transition",
                role === item.value ? "bg-[var(--brand-soft)] text-[var(--brand-dark)] ring-1 ring-blue-200" : "text-[var(--muted)]",
              )}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </div>

        <form method="post" onSubmit={handleRegister} className="mt-4 grid gap-3.5">
          {role === "SELLER" ? (
            <div className="rounded-[8px] border border-[var(--line)] bg-white p-2">
              <p className="px-1 pb-2 text-xs font-black text-[var(--ink)]">What will you sell?</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: "GENERAL" as const, title: "Products & services", helper: "Phones, fashion, jobs, vehicles" },
                  { value: "FOOD" as const, title: "Food seller", helper: "Meals, drinks, delivery orders" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStoreKind(item.value)}
                    className={cn(
                      "rounded-[7px] border p-3 text-left transition",
                      storeKind === item.value
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                        : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)]",
                    )}
                  >
                    <span className="block text-xs font-black">{item.title}</span>
                    <span className="mt-1 block text-[0.66rem] leading-4">{item.helper}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="text-xs font-semibold text-[var(--ink)]">
            Full name
            <span className="relative mt-2 block">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input name="name" autoComplete="name" required className="form-control w-full pl-10 pr-3 text-sm" />
            </span>
          </label>

          <label className="text-xs font-semibold text-[var(--ink)]">
            Username
            <span className="relative mt-2 block">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input name="username" autoComplete="username" required minLength={3} pattern="[A-Za-z0-9_]{3,30}" placeholder="jackstudios" className="form-control w-full pl-10 pr-3 text-sm" />
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[var(--ink)]">
              Email
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <input name="email" type="email" autoComplete="email" required className="form-control w-full pl-10 pr-3 text-sm" />
              </span>
            </label>
            <label className="text-xs font-semibold text-[var(--ink)]">
              Phone
              <span className="relative mt-2 block">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="024 000 0000" className="form-control w-full pl-10 pr-3 text-sm" />
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[var(--ink)]">
              Password
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <input name="password" type="password" autoComplete="new-password" required minLength={8} className="form-control w-full pl-10 pr-3 text-sm" />
              </span>
            </label>
            <label className="text-xs font-semibold text-[var(--ink)]">
              Confirm password
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} className="form-control w-full pl-10 pr-3 text-sm" />
              </span>
            </label>
          </div>

          <label className="text-xs font-semibold text-[var(--ink)]">
            Location
            <span className="relative mt-2 block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input name="location" defaultValue="Dunkwa-on-Offin" required className="form-control w-full pl-10 pr-3 text-sm" />
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-[0.68rem] leading-5 text-[var(--muted)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
            <span>I agree to the <Link href="/terms" target="_blank" className="font-bold text-[var(--brand-dark)]">Terms</Link>, <Link href="/privacy" target="_blank" className="font-bold text-[var(--brand-dark)]">Privacy Policy</Link>, and <Link href="/license-agreement" target="_blank" className="font-bold text-[var(--brand-dark)]">License Agreement</Link>.</span>
          </label>
          <TurnstileWidget key={turnstileReset} siteKey={turnstileSiteKey} onVerify={setTurnstileToken} />
          <button
            type="button"
            onClick={() => {
              if (!accepted) { setError("Tick the agreement box before continuing with Google."); return; }
              if (securityEnabled && !turnstileToken) { setError("Complete the Cloudflare security check before continuing with Google."); return; }
              if (googleEnabled) signIn("google", { callbackUrl: `/auth/complete?role=${role}&storeKind=${storeKind}` });
            }}
            disabled={!googleEnabled}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-5 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          {!googleEnabled ? <p className="text-center text-xs text-[var(--muted)]">Google sign-in needs OAuth keys.</p> : null}

          {error ? (
            <p className="flex items-start gap-2 rounded-[8px] bg-red-50 p-3 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="flex items-start gap-2 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">
              <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
              {success}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Creating..." : "Create account"}
            <ArrowRight size={16} />
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[var(--brand-dark)]">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPanel>
  );
}
