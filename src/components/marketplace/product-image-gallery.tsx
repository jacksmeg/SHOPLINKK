"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

type GalleryImage = {
  url: string;
  alt?: string | null;
};

export function ProductImageGallery({
  title,
  images,
}: {
  title: string;
  images: GalleryImage[];
}) {
  const galleryImages = images.length ? images : [{ url: "/window.svg", alt: title }];
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const current = galleryImages[active] ?? galleryImages[0];

  function move(direction: -1 | 1) {
    setActive((index) => (index + direction + galleryImages.length) % galleryImages.length);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] text-left"
        aria-label={`Open photos for ${title}`}
      >
        <span className="relative block aspect-[4/3]">
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--brand-dark)] shadow">
            {active + 1}/{galleryImages.length}
          </span>
        </span>
      </button>

      {galleryImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative aspect-square overflow-hidden rounded-[8px] border bg-white transition ${
                index === active ? "border-[var(--brand)] ring-2 ring-blue-100" : "border-[var(--line)] hover:border-[var(--line-strong)]"
              }`}
              aria-label={`View photo ${index + 1}`}
            >
              <Image src={image.url} alt={image.alt ?? title} fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#061a3a]/85 p-3" role="dialog" aria-modal="true">
          <div className="relative h-full w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full bg-white text-[var(--ink)] shadow-lg"
              aria-label="Close photos"
            >
              <X size={19} />
            </button>
            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--ink)] shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--ink)] shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            ) : null}
            <div className="relative h-full w-full overflow-hidden rounded-[8px] bg-black">
              <Image src={current.url} alt={current.alt ?? title} fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
