import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-16 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Wrench size={30} />
        </div>
        <h1 className="mt-5 text-xl font-black text-[var(--ink)]">ShopLinkk is under maintenance</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          We are improving the marketplace. Please check back soon.
        </p>
      </div>
    </div>
  );
}
