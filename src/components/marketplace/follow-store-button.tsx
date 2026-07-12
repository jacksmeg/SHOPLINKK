"use client";

import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function FollowStoreButton({
  storeId,
  initialFollowing,
  initialCount,
  canFollow,
}: {
  storeId: string;
  initialFollowing: boolean;
  initialCount: number;
  canFollow: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!canFollow) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-[var(--line-strong)] bg-white px-4 text-xs font-black text-[var(--brand-dark)] transition hover:border-[var(--brand)]"
      >
        <Heart size={16} />
        Follow store
      </Link>
    );
  }

  function toggleFollow() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/stores/${storeId}/follow`, {
        method: following ? "DELETE" : "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.message ?? "Could not update follow status.");
        return;
      }

      setFollowing(Boolean(data.following));
      setCount(Number(data.followerCount ?? count));
      setMessage(data.following ? "Store followed." : "Store unfollowed.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={pending}
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border px-4 text-xs font-black transition disabled:opacity-60",
          following
            ? "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300"
            : "border-[var(--line-strong)] bg-white text-[var(--brand-dark)] hover:border-[var(--brand)]",
        )}
      >
        {pending ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} fill={following ? "currentColor" : "none"} />}
        {following ? "Following" : "Follow store"}
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem]">{count}</span>
      </button>
      {message ? <p className="text-[0.68rem] font-semibold text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
