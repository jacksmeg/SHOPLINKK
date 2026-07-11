import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { completePayment } from "@/lib/billing";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function BillingCompletePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const reference = value(params, "reference") || value(params, "trxref") || value(params, "transaction_reference");
  let success = false;
  let message = "Payment reference was not found.";

  if (reference) {
    try {
      await completePayment(reference);
      success = true;
      message = "Payment confirmed. ShopLinkk has updated the listing or advert automatically.";
    } catch (error) {
      message = error instanceof Error ? error.message : "Payment could not be confirmed yet.";
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-16">
      <section className="app-panel w-full p-6 text-center">
        <div className={`mx-auto grid size-12 place-items-center rounded-[8px] ${success ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {success ? <CheckCircle2 size={24} /> : <CircleAlert size={24} />}
        </div>
        <h1 className="mt-4 text-lg font-black text-[var(--ink)]">{success ? "Payment successful" : "Payment needs attention"}</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{message}</p>
        {reference ? <p className="mt-3 text-[0.68rem] font-semibold text-[var(--muted)]">Reference: {reference}</p> : null}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/seller">Go to seller dashboard</ButtonLink>
          <Link href="/marketplace" className="inline-flex min-h-10 items-center rounded-[7px] px-4 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]">
            Browse marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}
