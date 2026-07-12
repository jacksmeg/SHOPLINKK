import Link from "next/link";
import { Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function RiderRegisterPage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-4 py-10">
      <section className="app-panel w-full p-6 text-center sm:p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-[14px] bg-[var(--brand)] text-white">
          <Truck size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[var(--ink)]">Become a ShopLinkk rider</h1>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[var(--muted)]">
          Create a rider account, verify your phone, upload your Ghana Card, license, vehicle document, and wait for admin approval before going online.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/register">Create rider account</ButtonLink>
          <ButtonLink href="/auth/complete?role=RIDER" variant="secondary">Use Google account</ButtonLink>
        </div>
        <p className="mt-5 text-xs text-[var(--muted)]">
          Already signed in? <Link href="/rider/profile" className="font-black text-[var(--brand-dark)]">Open rider application</Link>
        </p>
      </section>
    </main>
  );
}
