"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ContactSellerButton({
  productId,
  sellerId,
}: {
  productId: string;
  sellerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function startChat() {
    startTransition(async () => {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, sellerId }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        router.push(`/chat/${data.id}`);
      }
    });
  }

  return (
    <Button type="button" onClick={startChat} disabled={pending} className="w-full sm:w-auto">
      <MessageCircle size={18} />
      {pending ? "Opening chat..." : "Contact seller"}
    </Button>
  );
}
