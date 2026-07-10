"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "کپی متن" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <Button type="button" variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); toast.success("متن کپی شد."); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}{copied ? "کپی شد" : label}</Button>;
}
