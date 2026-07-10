import { describe, expect, it, vi } from "vitest";

import { scrollChatListToBottom } from "@/features/chat/scroll";

describe("chat realtime UI helpers", () => {
  it("scrolls only the message list to its own bottom", () => {
    const scrollTo = vi.fn();
    const messageList = { scrollHeight: 2_400, scrollTo };

    scrollChatListToBottom(messageList as Pick<HTMLElement, "scrollHeight" | "scrollTo">, "smooth");

    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({ top: 2_400, behavior: "smooth" });
  });
});
