"use client";

import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { AuthPanel, GoogleIcon } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedCallbackUrl = params.get("callbackUrl");
  const callbackUrl = requestedCallbackUrl?.startsWith("/") ? requestedCallbackUrl : "/";
  const registrationNotice = params.get("registered") === "verify";
  const verifiedStatus = params.get("verified");
  const verifiedEmail = params.get("email") ?? "";
  const verifiedNext = params.get("next");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setError("");

    if (!accepted) {
      setError("Tick the agreement box before signing in.");
      return;
    }

    startTransition(async () => {
      try {
        const check = await fetch("/api/auth/check-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password, termsAccepted: true }),
        });
        const checkData = await check.json().catch(() => null);

        if (!check.ok || checkData?.ok === false) {
          setError(checkData?.message ?? "Could not check your account. Try again.");
          return;
        }

        const result = await signIn("credentials", {
          redirect: false,
          identifier,
          password,
          termsAccepted: "true",
          callbackUrl,
        });

        if (!result || result.error) {
          setError("The email/phone or password is not correct. Check the details and try again.");
          return;
        }

        const session = await getSession();
        if (!session?.user?.id) {
          setError("Your details are correct, but the session could not start. Refresh this page and try again.");
          return;
        }

        await fetch("/api/security/login-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }).catch(() => null);

        const roleHome =
          session?.user?.role === "ADMIN" ? "/admin" : session?.user?.role === "SELLER" ? "/seller" : "/buyer";
        router.replace(callbackUrl === "/" ? roleHome : callbackUrl);
        router.refresh();
      } catch {
        setError("We could not reach ShopLinkk just now. Check your connection and try again.");
      }
    });
  }

  return (
    <AuthPanel mode="login">
      <div>
        <h1 className="text-xl font-black text-[var(--ink)]">Welcome back</h1>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Sign in with your username, email, or phone.</p>
        {registrationNotice ? (
          <p className="mt-3 rounded-[7px] bg-[var(--brand-soft)] p-3 text-xs font-semibold leading-5 text-[var(--brand-dark)]">
            Account created. Open the verification link sent to your email, then sign in.
          </p>
        ) : null}
        {verifiedStatus === "success" ? (
          <p className="mt-3 flex items-start gap-2 rounded-[7px] bg-blue-50 p-3 text-xs font-semibold leading-5 text-[var(--brand-dark)]">
            <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
            Email verified successfully. Sign in now to open your {verifiedNext === "seller" ? "seller dashboard" : verifiedNext === "admin" ? "admin dashboard" : "buyer dashboard"}.
          </p>
        ) : null}
        {verifiedStatus === "expired" || verifiedStatus === "invalid" ? (
          <p className="mt-3 flex items-start gap-2 rounded-[7px] bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={15} />
            {verifiedStatus === "expired" ? "That verification link has expired. Sign in if your account is already verified, or request a new link from Account Security." : "That verification link is not valid. Please use the latest email from ShopLinkk."}
          </p>
        ) : null}

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-[0.68rem] leading-5 text-[var(--muted)]">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
          <span>I agree to the <Link href="/terms" target="_blank" className="font-bold text-[var(--brand-dark)]">Terms</Link>, <Link href="/privacy" target="_blank" className="font-bold text-[var(--brand-dark)]">Privacy Policy</Link>, and <Link href="/license-agreement" target="_blank" className="font-bold text-[var(--brand-dark)]">License Agreement</Link>.</span>
        </label>

        <button
          type="button"
          onClick={() => {
            if (!accepted) { setError("Tick the agreement box before continuing with Google."); return; }
            if (googleEnabled) signIn("google", { callbackUrl: `/auth/complete?callback=${encodeURIComponent(callbackUrl)}` });
          }}
          disabled={!googleEnabled}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-5 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        {!googleEnabled ? <p className="mt-2 text-center text-xs text-[var(--muted)]">Google sign-in is not connected yet.</p> : null}

        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          or
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <form method="post" onSubmit={handleLogin} className="grid gap-3.5">
          <label className="text-xs font-semibold text-[var(--ink)]">
            Username, email, or phone number
            <span className="relative mt-2 block">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="username, name@email.com, or 024..."
                defaultValue={verifiedEmail}
                required
                className="form-control w-full pl-10 pr-3 text-sm"
              />
            </span>
          </label>
          <label className="text-xs font-semibold text-[var(--ink)]">
            <span className="flex items-center justify-between gap-3">
              Password
              <Link href="/forgot-password" className="text-xs font-bold text-[var(--brand)]">
                Forgot password?
              </Link>
            </span>
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="form-control w-full pl-10 pr-3 text-sm"
              />
            </span>
          </label>
          {error ? (
            <p className="flex items-start gap-2 rounded-[8px] bg-red-50 p-3 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Checking..." : "Sign in"}
            <ArrowRight size={16} />
          </Button>
        </form>

        <div className="mt-5 text-center text-xs">
          <span className="text-[var(--muted)]">
            New here?{" "}
            <Link href="/register" className="font-bold text-[var(--brand-dark)]">
              Create account
            </Link>
          </span>
        </div>
      </div>
    </AuthPanel>
  );
}
