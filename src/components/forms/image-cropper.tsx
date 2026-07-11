"use client";

/* eslint-disable @next/next/no-img-element */

import { Check, Move, RotateCcw, X, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageCropper({
  file,
  width,
  height,
  title,
  onCancel,
  onComplete,
}: {
  file: File;
  width: number;
  height: number;
  title: string;
  onCancel: () => void;
  onComplete: (file: File) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const aspect = width / height;

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  function reset() {
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
  }

  async function applyCrop() {
    const image = new window.Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This image could not be opened."));
    });

    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const baseWidth = sourceRatio > aspect ? image.naturalHeight * aspect : image.naturalWidth;
    const baseHeight = baseWidth / aspect;
    const sourceWidth = Math.max(1, Math.min(image.naturalWidth, baseWidth / zoom));
    const sourceHeight = Math.max(1, Math.min(image.naturalHeight, baseHeight / zoom));
    const x = (image.naturalWidth - sourceWidth) * (positionX / 100);
    const y = (image.naturalHeight - sourceHeight) * (positionY / 100);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, x, y, sourceWidth, sourceHeight, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("The cropped image could not be prepared.");
    const name = file.name.replace(/\.[^.]+$/, "") || "shoplinkk-cover";
    onComplete(new File([blob], `${name}-${width}x${height}.webp`, { type: "image/webp" }));
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[10px] border border-white/15 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">Image editor</p>
            <h2 className="mt-1 text-base font-black text-[var(--ink)]">{title}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Final size: {width} x {height} px</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close image editor" className="grid size-9 place-items-center rounded-[7px] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>

        <div className="p-5">
          <div className="relative mx-auto aspect-[16/9] max-h-[48vh] overflow-hidden rounded-[8px] bg-slate-100 ring-1 ring-slate-200" style={{ aspectRatio: `${width} / ${height}` }}>
            <img src={objectUrl} alt="Crop preview" className="absolute h-full w-full object-cover" style={{ transform: `scale(${zoom})`, objectPosition: `${positionX}% ${positionY}%` }} />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/70" />
            <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1.5 text-[0.64rem] font-semibold text-white"><Move size={12} /> Move the focus with the controls</div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-[var(--ink)]"><span className="flex items-center gap-1.5"><ZoomIn size={14} className="text-[var(--brand)]" /> Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-3 w-full accent-[var(--brand)]" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Horizontal focus<input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} className="mt-3 w-full accent-[var(--brand)]" /></label>
            <label className="text-xs font-bold text-[var(--ink)] sm:col-span-2">Vertical focus<input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} className="mt-3 w-full accent-[var(--brand)]" /></label>
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="secondary" onClick={reset}><RotateCcw size={15} /> Reset</Button>
            <div className="flex gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="button" onClick={() => void applyCrop()}><Check size={15} /> Apply crop</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
