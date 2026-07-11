import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const googleEnabled = await isGoogleAuthEnabled();
  return (
    <AuthCard variant="wide">
      <RegisterForm googleEnabled={googleEnabled} />
    </AuthCard>
  );
}
