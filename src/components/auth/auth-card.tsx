"use client";

import { motion } from "framer-motion";
import { BackButton } from "@/components/layout/back-button";
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
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="hidden lg:block">
            <Logo />
          </div>
          <BackButton label="Back" className="ml-auto" />
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
