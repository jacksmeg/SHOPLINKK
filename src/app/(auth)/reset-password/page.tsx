import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
