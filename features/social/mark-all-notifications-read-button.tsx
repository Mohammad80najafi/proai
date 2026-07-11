"use client";

import { useRouter } from "next/navigation";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRealtime } from "@/features/chat/realtime-provider";
import { markAllNotificationsReadAction } from "@/features/social/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <CheckCheck className="size-4" aria-hidden="true" />
      )}
      {pending ? "در حال خواندن…" : "خواندن همه"}
    </Button>
  );
}

export function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const { refreshUnreadCounts } = useRealtime();

  async function markAllRead() {
    try {
      await markAllNotificationsReadAction();
      await refreshUnreadCounts();
      router.refresh();
    } catch {
      toast.error("خواندن اعلان‌ها انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <form action={markAllRead}>
      <SubmitButton />
    </form>
  );
}
