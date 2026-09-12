import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PatientSession } from "@/api/contracts";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold, useScrollToField, type ScrollToField } from "@/components/ScreenScaffold";
import { ErrorState } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { TextField } from "@/components/TextField";
import { isPhotoPreparing, readyPhoto, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { sendErrorCopy } from "@/features/econsult/errorCopy";
import { recipientNameFor } from "@/features/econsult/recipients";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import type { SubmitInput } from "@/features/econsult/submit";
import { useQuestions } from "@/features/econsult/useQuestions";
import { useRecipients } from "@/features/econsult/useRecipients";
import { useSubmit } from "@/features/econsult/useSubmit";
import { isMessageThin, validateMessage } from "@/features/econsult/validation";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";
import { useSession } from "@/lib/devSettings";
import { newId } from "@/lib/ids";
import { useIsOffline } from "@/lib/network";
import { photoFileFor } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, spacing } from "@/theme/tokens";

const FIELD_LABEL = "What would you like to ask?";
const FIELD_HINT = "What helps your GP: where it is, since when, and what you have already tried.";
const THIN_NUDGE =
  "A little more detail helps your GP answer without asking back, for example where it is and since when.";
const CHANGE_HINT = "Choose a different person";
const OFFLINE_HINT = "You're offline. Sending needs a connection.";
const PREPARING_HINT = "Wait for the photo to finish preparing";
const SENDING_STATUS = "Sending your message";
const SENT_STATUS = "Message sent";
const SENT_WITH_PHOTO_STATUS = "Message sent, adding your photo";
const ERROR_TITLE = "Your message wasn't sent";

// Scroll to the field's container but focus its input: the anchor keeps the label and hint on
// screen, which the input alone would not at large text sizes.
function useFieldNodes() {
  const anchor = useRef<Focusable | null>(null);
  const focus = useRef<Focusable | null>(null);

  function setAnchor(node: Focusable | null) {
    anchor.current = node;
  }

  function setFocus(node: Focusable | null) {
    focus.current = node;
  }

  // Scroll before announcing: screen-reader focus alone leaves the screen looking untouched.
  function reportProblem(error: string, scrollToField: ScrollToField) {
    scrollToField(anchor.current);
    announce(error);
    focusForScreenReader(focus.current);
  }

  return { setAnchor, setFocus, reportProblem };
}

function submitInputFor(
  draft: DraftState,
  session: PatientSession,
  recipientId: string,
  idempotencyKey: string,
): SubmitInput {
  const photo = readyPhoto(draft);
  return {
    session,
    recipientId,
    message: draft.message,
    answers: draft.answers,
    photo: photo ? photoFileFor(photo) : null,
    idempotencyKey,
  };
}

type Send = (scrollToField: ScrollToField) => Promise<void>;

// The status line is a live region, so every change to it is also spoken once.
function useAnnouncedStatus() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (status) announce(status);
  }, [status]);

  return [status, setStatus] as const;
}

function useSend() {
  const router = useRouter();
  const session = useSession();
  const { draft, dispatch } = useDraft();
  const [messageError, setMessageError] = useState<string | null>(null);
  const [status, setStatus] = useAnnouncedStatus();
  const { setAnchor, setFocus, reportProblem } = useFieldNodes();
  const hasPhoto = readyPhoto(draft) !== null;
  const submit = useSubmit((econsultId) => {
    dispatch({ type: "econsultCreated", econsultId });
    setStatus(hasPhoto ? SENT_WITH_PHOTO_STATUS : SENT_STATUS);
  });

  function onMessageChange(message: string) {
    dispatch({ type: "messageChanged", message });
    if (messageError) setMessageError(null);
  }

  const onSend: Send = async (scrollToField) => {
    const error = validateMessage(draft.message);
    setMessageError(error);
    if (error) {
      reportProblem(error, scrollToField);
      return;
    }
    if (!draft.recipientId) return;
    const idempotencyKey = draft.idempotencyKey ?? newId();
    dispatch({ type: "submitStarted", idempotencyKey });
    setStatus(SENDING_STATUS);
    try {
      const outcome = await submit.mutateAsync(
        submitInputFor(draft, session, draft.recipientId, idempotencyKey),
      );
      dispatch({ type: "attachmentSettled", attachment: outcome.attachment });
      router.replace("/econsult/sent");
    } catch {
      // The mutation's own error state renders the failure; this only drops the status line.
      setStatus("");
    }
  };

  return { submit, status, messageError, setAnchor, setFocus, onMessageChange, onSend };
}

type SendState = ReturnType<typeof useSend>;

function sendHint(isOffline: boolean, preparing: boolean): string | undefined {
  if (isOffline) return OFFLINE_HINT;
  return preparing ? PREPARING_HINT : undefined;
}

// Rendered inside the scaffold, so unlike the screen itself it can reach the scroll view.
function SendButton({
  send,
  isOffline,
  preparing,
}: {
  send: SendState;
  isOffline: boolean;
  preparing: boolean;
}) {
  const scrollToField = useScrollToField();
  return (
    <PrimaryButton
      label="Send"
      busyLabel="Sending"
      busy={send.submit.isPending}
      disabled={isOffline || preparing}
      accessibilityHint={sendHint(isOffline, preparing)}
      onPress={() => void send.onSend(scrollToField)}
    />
  );
}

function ToRow({ name, onChange }: { name: string; onChange: () => void }) {
  return (
    <View style={styles.toRow}>
      <Text style={styles.to}>To: {name}</Text>
      <TextButton label="Change" accessibilityHint={CHANGE_HINT} onPress={onChange} />
    </View>
  );
}

function MessageField({ send, message }: { send: SendState; message: string }) {
  return (
    <>
      <TextField
        containerRef={(node) => send.setAnchor(node)}
        ref={(node) => send.setFocus(node)}
        label={FIELD_LABEL}
        hint={FIELD_HINT}
        value={message}
        onChangeText={send.onMessageChange}
        error={send.messageError}
        editable={!send.submit.isPending}
        multiline
      />
      {isMessageThin(message) ? (
        <Text accessibilityLiveRegion="polite" style={text.muted}>
          {THIN_NUDGE}
        </Text>
      ) : null}
    </>
  );
}

function DraftPhotoPicker({ disabled }: { disabled: boolean }) {
  const { draft, dispatch } = useDraft();
  return (
    <PhotoPicker
      photo={draft.photo}
      disabled={disabled}
      onPickStarted={(pickId) => dispatch({ type: "photoPickStarted", pickId })}
      onPickReady={(pickId, result) => dispatch({ type: "photoReady", pickId, ...result })}
      onRemove={() => dispatch({ type: "photoRemoved" })}
    />
  );
}

// Also inside the scaffold, so Retry sends with the same scroll-to-field the button uses.
function SendFeedback({
  status,
  error,
  onSend,
}: {
  status: string;
  error: Error | null;
  onSend: Send;
}) {
  const scrollToField = useScrollToField();
  return (
    <>
      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}
      {error ? (
        <ErrorState
          title={ERROR_TITLE}
          body={sendErrorCopy(error)}
          onRetry={() => void onSend(scrollToField)}
        />
      ) : null}
    </>
  );
}

export default function MessageScreen() {
  const router = useRouter();
  const isOffline = useIsOffline();
  const { draft } = useDraft();
  const recipients = useRecipients();
  const hasQuestions = useQuestions().length > 0;
  const send = useSend();
  const preparing = isPhotoPreparing(draft);

  return (
    <ScreenScaffold action={<SendButton send={send} isOffline={isOffline} preparing={preparing} />}>
      <StepHeader
        stepNumber={stepNumber("message", hasQuestions)}
        stepCount={stepCount(hasQuestions)}
        title={STEP_TITLES.message}
      />
      <ToRow
        name={recipientNameFor(recipients, draft.recipientId)}
        onChange={() => router.dismissTo("/econsult/recipient")}
      />
      <MessageField send={send} message={draft.message} />
      <DraftPhotoPicker disabled={send.submit.isPending} />
      <SendFeedback status={send.status} error={send.submit.error} onSend={send.onSend} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  toRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  to: {
    flexShrink: 1,
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
  },
  status: {
    color: colors.primary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
  },
});
