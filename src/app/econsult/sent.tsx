import { useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { readyPhoto } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { sendErrorCopy } from "@/features/econsult/errorCopy";
import { recipientNameFor } from "@/features/econsult/recipients";
import { useRecipients } from "@/features/econsult/useRecipients";
import { useRetryAttachment } from "@/features/econsult/useSubmit";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";
import { photoFileFor } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";

const TITLE = "Message sent";
const REPLY_TIME = "Your practice usually replies within two working days.";
const PHOTO_FAILED = "Your message was sent, but the photo could not be attached.";
const PHOTO_ATTACHED = "Your photo was attached.";
const PHOTO_STILL_FAILED =
  "The photo still couldn't be attached. You can try again or continue without it.";
const RETRY_LABEL = "Try again";
const RETRY_BUSY_LABEL = "Attaching your photo";
const CONTINUE_WITHOUT_PHOTO = "Continue without the photo";

// mutateAsync rejects on anything the upload does not report as a photo outcome, so the rejection
// is caught here and shown from the mutation's own error state instead of going unhandled.
function usePhotoRetry() {
  const { draft, dispatch } = useDraft();
  const retry = useRetryAttachment();
  const [hasRetryFailed, setHasRetryFailed] = useState(false);
  const photo = readyPhoto(draft);
  const { econsultId } = draft;

  async function run() {
    if (!photo || !econsultId) return;
    setHasRetryFailed(false);
    try {
      const attachment = await retry.mutateAsync({ econsultId, photo: photoFileFor(photo) });
      dispatch({ type: "attachmentSettled", attachment });
      // An upload the API rejects resolves as an outcome rather than throwing, so this branch is
      // the only place a repeated failure becomes visible.
      if (attachment === "failed") {
        setHasRetryFailed(true);
        announce(PHOTO_STILL_FAILED);
      }
    } catch (error) {
      // The alert is already mounted, so iOS only speaks the new line when it is announced.
      announce(sendErrorCopy(error));
    }
  }

  return {
    start: () => void run(),
    isPending: retry.isPending,
    error: retry.error,
    hasRetryFailed,
  };
}

// The alert groups only the text, so the two buttons stay separately focusable elements.
function PhotoOutcome() {
  const { draft, dispatch } = useDraft();
  const retry = usePhotoRetry();

  if (draft.attachment === "attached") return <Text style={text.body}>{PHOTO_ATTACHED}</Text>;
  if (draft.attachment !== "failed") return null;
  return (
    <View style={styles.warning}>
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.stack}
      >
        <Text style={text.body}>{PHOTO_FAILED}</Text>
        {retry.hasRetryFailed ? <Text style={text.body}>{PHOTO_STILL_FAILED}</Text> : null}
        {retry.error ? <Text style={text.body}>{sendErrorCopy(retry.error)}</Text> : null}
      </View>
      <PrimaryButton
        label={RETRY_LABEL}
        busy={retry.isPending}
        busyLabel={RETRY_BUSY_LABEL}
        onPress={retry.start}
      />
      <TextButton
        label={CONTINUE_WITHOUT_PHOTO}
        onPress={() => dispatch({ type: "attachmentSettled", attachment: "none" })}
      />
    </View>
  );
}

export default function SentScreen() {
  const router = useRouter();
  const { draft } = useDraft();
  const recipients = useRecipients();
  const [isLeaving, setIsLeaving] = useState(false);
  const headingRef = useRef<Focusable | null>(null);

  // The guard stays up until Done lowers it; the unwind runs in the effect below, by which time
  // the guard is already down, so Done is not blocked by it.
  usePreventRemove(!isLeaving, () => {});

  useEffect(() => {
    focusForScreenReader(headingRef.current);
  }, []);

  useEffect(() => {
    if (isLeaving) router.dismissTo("/");
  }, [isLeaving, router]);

  return (
    <ScreenScaffold action={<PrimaryButton label="Done" onPress={() => setIsLeaving(true)} />}>
      <Text
        ref={(node) => {
          headingRef.current = node;
        }}
        accessibilityRole="header"
        style={text.title}
      >
        {TITLE}
      </Text>
      <Text style={text.body}>Sent to {recipientNameFor(recipients, draft.recipientId)}.</Text>
      <Text style={text.body}>{REPLY_TIME}</Text>
      <Text style={text.body}>Reference: {draft.econsultId}</Text>
      <PhotoOutcome />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  warning: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius,
    backgroundColor: colors.warningSurface,
  },
});
