import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const googleEnabled = await isGoogleAuthEnabled();
  return (
    <AuthCard variant="wide">
      <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading login...</div>}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthCard>
  );
}
