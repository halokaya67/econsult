import { useRouter } from "expo-router";
import { useCallback, useRef, useState, type RefObject } from "react";
import type { ScrollToField } from "@/components/ScreenScaffold";
import { useFocusAfterCommit } from "@/hooks/useFocusAfterCommit";
import { useFocusOnLayout } from "@/hooks/useFocusOnLayout";
import { useSession } from "@/hooks/useSession";
import { announce, focusForScreenReader, focusOrAnnounce, type Focusable } from "@/lib/announce";
import { devWarn } from "@/lib/devWarn";
import { runOnce } from "@/lib/inFlight";
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
  const focusAfterCommit = useFocusAfterCommit();

  function setAnchor(node: Focusable | null) {
    anchor.current = node;
  }

  function setFocus(node: Focusable | null) {
    focus.current = node;
  }

  // Scroll before moving focus: screen-reader focus alone leaves the screen looking untouched. The
  // focus waits for the commit that folds the error into the field's name, or it speaks the old one.
  function validate(message: string, scrollToField: ScrollToField): string | null {
    const next = validateMessage(message);
    setError(next);
    if (next === null) return null;
    scrollToField(anchor.current);
    focusAfterCommit(() => focusOrAnnounce(focus.current, next));
    return next;
  }

  function clearError() {
    if (error) setError(null);
  }

  return { error, setAnchor, setFocus, validate, clearError };
}

// A failed send inserts the error card above Send, which pushes the card, Try again and Send below
// the fold on a short screen. The card is scrolled to before it takes focus, so the move does not
// leave the screen looking untouched, and both wait for the layout that gives the card a view.
export function useRevealSendError(
  card: RefObject<Focusable | null>,
  scrollToField: ScrollToField,
): () => void {
  return useFocusOnLayout(card, (node) => {
    scrollToField(node);
    focusForScreenReader(node);
  });
}

// A spoken status line has the announcement as its only channel, so it is heard once on both
// platforms; announcing here also keeps the side effect next to the event that caused it.
function useStatusLine() {
  const [status, setStatus] = useState("");

  const speakStatus = useCallback((next: string) => {
    setStatus(next);
    announce(next);
  }, []);

  return { status, setStatus, speakStatus };
}

export function useMessageSend() {
  const router = useRouter();
  const session = useSession();
  const { draft, dispatch } = useDraft();
  const { status, setStatus, speakStatus } = useStatusLine();
  const field = useMessageField();
  // isPending only reaches React a macrotask later, so the disabled button cannot stop a second tap
  // inside the first one's tick; this ref can.
  const isInFlight = useRef(false);
  const hasPhoto = readyPhoto(draft) !== null;
  const submit = useSubmit((econsultId) => {
    dispatch({ type: "econsultCreated", econsultId });
    // The confirmation's heading is "Message sent" too and is read on arrival, so the plain status
    // is shown without being spoken; the photo line reports progress before that screen exists.
    if (hasPhoto) speakStatus(SENT_WITH_PHOTO_STATUS);
    else setStatus(SENT_STATUS);
  });

  function onMessageChange(message: string) {
    dispatch({ type: "messageChanged", message });
    field.clearError();
  }

  const onSend: Send = (scrollToField) =>
    runOnce(isInFlight, async () => {
      const { recipientId } = draft;
      if (field.validate(draft.message, scrollToField) !== null) return;
      if (recipientId === null) {
        devWarn(NO_RECIPIENT_WARNING);
        return;
      }
      const idempotencyKey = idempotencyKeyFor(draft);
      dispatch({ type: "submitStarted", idempotencyKey });
      speakStatus(SENDING_STATUS);
      try {
        const outcome = await submit.mutateAsync(
          submitInputFor(draft, session, recipientId, idempotencyKey),
        );
        dispatch({ type: "attachmentSettled", attachment: outcome.attachment });
        router.replace("/econsult/sent");
      } catch {
        // The mutation's own error state renders the failure; this only drops the status line.
        setStatus("");
      }
    });

  return { submit, status, field, onMessageChange, onSend };
}

export type SendState = ReturnType<typeof useMessageSend>;
