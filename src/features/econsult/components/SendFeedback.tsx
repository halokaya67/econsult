import { useRef } from "react";
import { Text } from "react-native";
import { ErrorState } from "@/components/ErrorState";
import { useScrollToField } from "@/components/ScreenScaffold/ScreenScaffold";
import type { Focusable } from "@/lib/announce";
import { OFFLINE_HINT } from "@/lib/copy";
import { text } from "@/theme/text";
import { useRevealSendError, type Send } from "../hooks/useMessageSend";
import { sendErrorCopy } from "../utils/errorCopy";

type Props = { status: string; error: Error | null; isOffline: boolean; onSend: Send };

export const ERROR_TITLE = "Your message wasn't sent";

// Also inside the scaffold, so Retry sends with the same scroll-to-field the button uses, and a
// failed send can scroll its own error card into view.
export function SendFeedback({ status, error, isOffline, onSend }: Props) {
  const scrollToField = useScrollToField();
  const card = useRef<Focusable | null>(null);
  const onCardLayout = useRevealSendError(card, scrollToField);
  return (
    <>
      {/* Not a live region: the hook announces the status, and both would speak it on Android. */}
      {status ? <Text style={text.status}>{status}</Text> : null}
      {error ? (
        <ErrorState
          ref={(node) => {
            card.current = node;
          }}
          onLayout={onCardLayout}
          title={ERROR_TITLE}
          body={sendErrorCopy(error)}
          retryBlockedReason={isOffline ? OFFLINE_HINT : undefined}
          onRetry={() => void onSend(scrollToField)}
        />
      ) : null}
    </>
  );
}
