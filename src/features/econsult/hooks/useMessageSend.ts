import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { ScrollToField } from "@/hooks/useScrollToField";
import { useSession } from "@/hooks/useSession";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";
import { devWarn } from "@/lib/devWarn";
import { idempotencyKeyFor, submitInputFor } from "../api/submit";
import { readyPhoto } from "../state/draft";
import { useDraft } from "../state/DraftProvider";
import { validateMessage } from "../utils/validation";
import { useSubmit } from "./useSubmit";

const SENDING_STATUS = "Sending your message";
const SENT_STATUS = "Message sent";
const SENT_WITH_PHOTO_STATUS = "Message sent, adding your photo";
const NO_RECIPIENT_WARNING =
  "Send pressed with no recipient in the draft; only a deep link past step 1 reaches this.";

export type Send = (scrollToField: ScrollToField) => Promise<void>;

// Scroll to the field's container but focus its input: the anchor keeps the label and hint on
// screen, which the input alone would not at large text sizes.
function useMessageField() {
  const anchor = useRef<Focusable | null>(null);
  const focus = useRef<Focusable | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setAnchor(node: Focusable | null) {
    anchor.current = node;
  }

  function setFocus(node: Focusable | null) {
    focus.current = node;
  }

  // Scroll before announcing: screen-reader focus alone leaves the screen looking untouched.
  function validate(message: string, scrollToField: ScrollToField): string | null {
    const next = validateMessage(message);
    setError(next);
    if (next === null) return null;
    scrollToField(anchor.current);
    announce(next);
    focusForScreenReader(focus.current);
    return next;
  }

  function clearError() {
    if (error) setError(null);
  }

  return { error, setAnchor, setFocus, validate, clearError };
}

// The announcement is the status line's only spoken channel, so it is heard once on both platforms;
// setting it here also keeps the side effect next to the event that caused it.
function useAnnouncedStatus() {
  const [status, setStatus] = useState("");

  const announceStatus = useCallback((next: string) => {
    setStatus(next);
    if (next) announce(next);
  }, []);

  return [status, announceStatus] as const;
}

export function useMessageSend() {
  const router = useRouter();
  const session = useSession();
  const { draft, dispatch } = useDraft();
  const [status, setStatus] = useAnnouncedStatus();
  const field = useMessageField();
  // isPending only reaches React a macrotask later, so the disabled button cannot stop a second tap
  // inside the first one's tick; this ref can.
  const isInFlight = useRef(false);
  const hasPhoto = readyPhoto(draft) !== null;
  const submit = useSubmit((econsultId) => {
    dispatch({ type: "econsultCreated", econsultId });
    setStatus(hasPhoto ? SENT_WITH_PHOTO_STATUS : SENT_STATUS);
  });

  function onMessageChange(message: string) {
    dispatch({ type: "messageChanged", message });
    field.clearError();
  }

  const onSend: Send = async (scrollToField) => {
    if (isInFlight.current) return;
    const { recipientId } = draft;
    if (field.validate(draft.message, scrollToField) !== null) return;
    if (recipientId === null) {
      devWarn(NO_RECIPIENT_WARNING);
      return;
    }
    const idempotencyKey = idempotencyKeyFor(draft);
    dispatch({ type: "submitStarted", idempotencyKey });
    setStatus(SENDING_STATUS);
    isInFlight.current = true;
    try {
      const outcome = await submit.mutateAsync(
        submitInputFor(draft, session, recipientId, idempotencyKey),
      );
      dispatch({ type: "attachmentSettled", attachment: outcome.attachment });
      router.replace("/econsult/sent");
    } catch {
      // The mutation's own error state renders the failure; this only drops the status line.
      setStatus("");
    } finally {
      isInFlight.current = false;
    }
  };

  return { submit, status, field, onMessageChange, onSend };
}

export type SendState = ReturnType<typeof useMessageSend>;
