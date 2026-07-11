export function ShopLinkkLoader({ label = "Loading ShopLinkk" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2.5" role="status" aria-live="polite">
      <span className="shoplinkk-loader" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => <span key={index} />)}
      </span>
      <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
    </div>
  );
}
