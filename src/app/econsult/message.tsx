import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold, useScrollToField } from "@/components/ScreenScaffold";
import { ErrorState } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { TextField } from "@/components/TextField";
import { PhotoPicker } from "@/features/econsult/components/PhotoPicker";
import { isPhotoPreparing } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { sendErrorCopy } from "@/features/econsult/errorCopy";
import { recipientNameFor } from "@/features/econsult/recipients";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import { useMessageSend, type Send, type SendState } from "@/features/econsult/useMessageSend";
import { useQuestions } from "@/features/econsult/useQuestions";
import { useRecipients } from "@/features/econsult/useRecipients";
import { isMessageThin } from "@/features/econsult/validation";
import { useIsOffline } from "@/lib/network";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, spacing } from "@/theme/tokens";

const FIELD_LABEL = "What would you like to ask?";
const FIELD_HINT = "What helps your GP: where it is, since when, and what you have already tried.";
const THIN_NUDGE =
  "A little more detail helps your GP answer without asking back, for example where it is and since when.";
const CHANGE_HINT = "Choose a different person";
const OFFLINE_HINT = "You're offline. Sending needs a connection.";
const PREPARING_HINT = "Wait for the photo to finish preparing";
const ERROR_TITLE = "Your message wasn't sent";

function sendHint(isOffline: boolean, isPreparing: boolean): string | undefined {
  if (isOffline) return OFFLINE_HINT;
  return isPreparing ? PREPARING_HINT : undefined;
}

// Rendered inside the scaffold, so unlike the screen itself it can reach the scroll view.
function SendButton({
  send,
  isOffline,
  isPreparing,
}: {
  send: SendState;
  isOffline: boolean;
  isPreparing: boolean;
}) {
  const scrollToField = useScrollToField();
  return (
    <PrimaryButton
      label="Send"
      busyLabel="Sending"
      busy={send.submit.isPending}
      disabled={isOffline || isPreparing}
      accessibilityHint={sendHint(isOffline, isPreparing)}
      onPress={() => void send.onSend(scrollToField)}
    />
  );
}

function ToRow({
  name,
  disabled,
  onChange,
}: {
  name: string;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.toRow}>
      <Text style={styles.to}>To: {name}</Text>
      <TextButton
        label="Change"
        disabled={disabled}
        accessibilityHint={CHANGE_HINT}
        onPress={onChange}
      />
    </View>
  );
}

// The two wrappers look redundant but are not: reading a ref setter during render trips the
// compiler's react-hooks/refs rule, so the node is handed over from inside the callback instead.
function MessageField({ send, message }: { send: SendState; message: string }) {
  return (
    <>
      <TextField
        containerRef={(node) => send.field.setAnchor(node)}
        ref={(node) => send.field.setFocus(node)}
        label={FIELD_LABEL}
        hint={FIELD_HINT}
        value={message}
        onChangeText={send.onMessageChange}
        error={send.field.error}
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
  isOffline,
  onSend,
}: {
  status: string;
  error: Error | null;
  isOffline: boolean;
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
          retryBlockedReason={isOffline ? OFFLINE_HINT : undefined}
          onRetry={() => void onSend(scrollToField)}
        />
      ) : null}
    </>
  );
}

export default function MessageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isOffline = useIsOffline();
  const { draft } = useDraft();
  const recipients = useRecipients();
  const hasQuestions = useQuestions().length > 0;
  const send = useMessageSend();
  const isPreparing = isPhotoPreparing(draft);
  const isSending = send.submit.isPending;

  // Back, swipe and step 1's Home button wait for the send to settle. A replace is re-dispatched
  // instead, so reaching the confirmation never depends on which render the lock is read from.
  usePreventRemove(isSending, ({ data }) => {
    if (data.action.type === "REPLACE") navigation.dispatch(data.action);
  });

  return (
    <ScreenScaffold
      action={<SendButton send={send} isOffline={isOffline} isPreparing={isPreparing} />}
    >
      <StepHeader
        stepNumber={stepNumber("message", hasQuestions)}
        stepCount={stepCount(hasQuestions)}
        title={STEP_TITLES.message}
      />
      <ToRow
        name={recipientNameFor(recipients, draft.recipientId)}
        disabled={isSending}
        onChange={() => router.dismissTo("/econsult/recipient")}
      />
      <MessageField send={send} message={draft.message} />
      <DraftPhotoPicker disabled={isSending} />
      <SendFeedback
        status={send.status}
        error={send.submit.error}
        isOffline={isOffline}
        onSend={send.onSend}
      />
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
