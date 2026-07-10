export function scrollChatListToBottom(
  element: Pick<HTMLElement, "scrollHeight" | "scrollTo">,
  behavior: ScrollBehavior,
) {
  element.scrollTo({ top: element.scrollHeight, behavior });
}
