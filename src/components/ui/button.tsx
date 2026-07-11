import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const styles = {
  base: "uiverse-sheen relative isolate inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-[7px] px-4 text-xs font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
  variants: {
    primary:
      "button-sheen-light bg-[var(--button-primary)] text-white shadow-sm hover:-translate-y-px hover:bg-[var(--button-primary-hover)] hover:shadow-lg focus-visible:outline-[var(--brand)] active:translate-y-0",
    secondary:
      "button-sheen-blue border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:-translate-y-px hover:border-[var(--brand)] hover:text-[var(--brand-dark)] active:translate-y-0",
    dark: "bg-[var(--ink)] text-white hover:-translate-y-px hover:bg-black active:translate-y-0",
    ghost:
      "text-[var(--muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)]",
    danger:
      "bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700 focus-visible:outline-red-600",
  },
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles.variants;
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof styles.variants;
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(styles.base, styles.variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(styles.base, styles.variants[variant], className)}
      {...props}
    />
  );
}
