import { Suspense } from "react";
import { CompleteAuthFlow } from "@/components/auth/complete-auth-flow";

export const dynamic = "force-dynamic";

function CompletingFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <div className="w-full max-w-sm rounded-[8px] border border-[var(--line)] bg-white p-5 text-center shadow-xl">
        <h1 className="text-sm font-black text-[var(--ink)]">ShopLinkk</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Finishing your account...</p>
      </div>
    </main>
  );
}

export default function CompleteAuthPage() {
  return (
    <Suspense fallback={<CompletingFallback />}>
      <CompleteAuthFlow />
    </Suspense>
  );
}
