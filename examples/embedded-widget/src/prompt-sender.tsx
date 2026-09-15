import { useEffect } from "react";
import { useVexaHost } from "vexa/react";

/** Sends `pending` into the chat as soon as the overlay has registered its sender, then clears it. */
export function PromptSender({ pending, onSent }: { pending: string | null; onSent: () => void }) {
  const { sendToChat } = useVexaHost();
  useEffect(() => {
    if (pending === null) return;
    if (sendToChat(pending)) onSent();
  }, [pending, sendToChat, onSent]);
  return null;
}
