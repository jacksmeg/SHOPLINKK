import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [googleEnabled, turnstileSiteKey] = await Promise.all([isGoogleAuthEnabled(), getTurnstileSiteKey()]);
  return (
    <AuthCard variant="wide">
      <RegisterForm googleEnabled={googleEnabled} turnstileSiteKey={turnstileSiteKey} />
    </AuthCard>
  );
}
