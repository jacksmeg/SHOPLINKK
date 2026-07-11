import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-16 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand)]">
          <SearchX size={30} />
        </div>
        <h1 className="mt-5 text-xl font-black text-[var(--ink)]">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The page may have moved, or the listing may no longer be public.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/marketplace">Browse products</ButtonLink>
          <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
        </div>
      </div>
    </div>
  );
}
