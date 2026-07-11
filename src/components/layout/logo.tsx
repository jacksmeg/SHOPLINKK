import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="ShopLinkk home">
      <span className="grid size-9 place-items-center overflow-hidden rounded-[8px] bg-[var(--brand-soft)] shadow-sm ring-1 ring-blue-100 transition duration-200 group-hover:-rotate-3 group-hover:shadow-lg">
        <Image
          src="/brand/shoplinkk-mark.webp"
          alt=""
          width={256}
          height={256}
          className="scale-[1.38] object-contain"
          priority
        />
      </span>
      <span className="text-lg font-black text-[var(--ink)]">
        Shop<span className="text-[var(--brand)]">Linkk</span>
      </span>
    </Link>
  );
}
