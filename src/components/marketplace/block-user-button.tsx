"use client";

import { Ban } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function BlockUserButton({ userId }: { userId: string }) {
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function block() {
    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !blocked, reason: "Blocked by user" }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) setBlocked((current) => !current);
    });
  }

  return (
    <Button type="button" variant="secondary" disabled={pending} onClick={block}>
      <Ban size={17} />
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
}

