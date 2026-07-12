import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function compactDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function tradingAge(value?: Date | string | null) {
  if (!value) return "New on ShopLinkk";
  const date = typeof value === "string" ? new Date(value) : value;
  const months = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (months < 1) return "New on ShopLinkk";
  if (months < 12) return `Trading on ShopLinkk for ${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `Trading on ShopLinkk for ${years} year${years === 1 ? "" : "s"}`;
}
