"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  variant = "compact",
}: {
  children: React.ReactNode;
  variant?: "compact" | "wide";
}) {
  const wide = variant === "wide";

  return (
    <div className="auth-stage flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
      <motion.div
        initial={{ opacity: 1, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn("w-full", wide ? "max-w-[1128px]" : "max-w-[430px]")}
      >
        <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
          <Logo />
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]"
          >
            <ArrowLeft size={15} />
            Browse
          </Link>
        </div>

        {wide ? (
          children
        ) : (
          <motion.section
            initial={{ opacity: 1, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.38, ease: "easeOut" }}
            className="auth-card overflow-hidden rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="auth-flow -mx-6 -mt-6 mb-6 h-1" />
            {children}
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}
