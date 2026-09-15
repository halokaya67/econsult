import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState, type Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { PHOTO_STILL_FAILED, usePhotoRetry } from "@/features/econsult/hooks/usePhotoRetry";
import { useRecipients } from "@/features/econsult/hooks/useRecipients";
import { sentSubmission, type SentSubmission } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { sendErrorCopy } from "@/features/econsult/utils/errorCopy";
import { recipientNameFor } from "@/features/econsult/utils/recipients";
import { useFocusOnArrival, type ArrivalNavigation } from "@/hooks/useFocusOnArrival";
import type { Focusable } from "@/lib/announce";
import { OFFLINE_HINT, RETRY_LABEL } from "@/lib/copy";
import { useIsOffline } from "@/providers/NetworkProvider";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";

const TITLE = "Message sent";
const REPLY_TIME = "Your practice usually replies within two working days.";
const PHOTO_FAILED = "Your message was sent, but the photo could not be attached.";
const PHOTO_ATTACHED = "Your photo was attached.";
const RETRY_BUSY_LABEL = "Attaching your photo";
const CONTINUE_WITHOUT_PHOTO = "Continue without the photo";

// The alert groups only the text, so the two buttons stay separately focusable elements and its
// name is the photo-failed line the arrival focus speaks. It is not a live region: the retry hook
// announces every line it adds, and both would speak it on Android.
function PhotoOutcome({ submission, ref }: { submission: SentSubmission; ref?: Ref<View> }) {
  const { dispatch } = useDraft();
  const isOffline = useIsOffline();
  const retry = usePhotoRetry(submission.econsultId);

  if (submission.attachment === "attached") return <Text style={text.body}>{PHOTO_ATTACHED}</Text>;
  if (submission.attachment !== "failed") return null;
  return (
    <View style={styles.warning}>
      <View ref={ref} accessible accessibilityRole="alert" style={styles.stack}>
        <Text style={text.body}>{PHOTO_FAILED}</Text>
        {retry.hasRetryFailed ? <Text style={text.body}>{PHOTO_STILL_FAILED}</Text> : null}
        {retry.error ? <Text style={text.body}>{sendErrorCopy(retry.error)}</Text> : null}
      </View>
      <PrimaryButton
        label={RETRY_LABEL}
        busy={retry.isPending}
        busyLabel={RETRY_BUSY_LABEL}
        disabled={isOffline}
        accessibilityHint={isOffline ? OFFLINE_HINT : undefined}
        onPress={retry.start}
      />
      <TextButton
        label={CONTINUE_WITHOUT_PHOTO}
        onPress={() =>
          dispatch({
            type: "attachmentSettled",
            econsultId: submission.econsultId,
            attachment: "none",
          })
        }
      />
    </View>
  );
}

export default function SentScreen() {
  const router = useRouter();
  const navigation = useNavigation<ArrivalNavigation>();
  const { draft } = useDraft();
  const recipients = useRecipients();
  const [isLeaving, setIsLeaving] = useState(false);
  const headingRef = useRef<Focusable | null>(null);
  const alertRef = useRef<Focusable | null>(null);
  const sent = sentSubmission(draft);
  const hasFailedPhoto = sent?.attachment === "failed";

  // The guard stays up until Done lowers it; the unwind runs in the effect below, by which time
  // the guard is already down, so Done is not blocked by it.
  usePreventRemove(!isLeaving, () => {});

  // One thing speaks on arrival. A failed photo takes the focus itself, because its alert is named
  // with the line that matters most; the heading and an announcement as well cut it off mid-word.
  useFocusOnArrival(navigation, hasFailedPhoto ? alertRef : headingRef);

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
      <Text style={text.body}>Reference: {sent?.econsultId}</Text>
      {sent && (
        <PhotoOutcome
          submission={sent}
          ref={(node) => {
            alertRef.current = node;
          }}
        />
      )}
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
