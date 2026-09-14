import { useEffect, type Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import { announce } from "@/lib/announce";
import { RETRY_LABEL } from "@/lib/retryLabel";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

// The alert groups only the two texts; the retry button stays a sibling so it remains its own
// element. A blocking reason disables Retry and is spoken as its hint, so the block is never silent.
export function ErrorState({
  title,
  body,
  onRetry,
  retryBlockedReason,
  ref,
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retryBlockedReason?: string;
  // The ref lands on the alert, the element a caller scrolls to and moves screen-reader focus to.
  ref?: Ref<View>;
}) {
  // A live region is Android-only, which left the alert silent on iOS; the announcement speaks it
  // on both, so the region is gone rather than saying it twice on Android.
  useEffect(() => {
    announce(`${title}. ${body}`);
  }, [title, body]);

  return (
    <View style={[styles.stack, styles.errorBox]}>
      <View ref={ref} accessible accessibilityRole="alert" style={styles.stack}>
        <Text style={text.heading}>{title}</Text>
        <Text style={text.body}>{body}</Text>
      </View>
      <PrimaryButton
        label={RETRY_LABEL}
        disabled={retryBlockedReason !== undefined}
        accessibilityHint={retryBlockedReason}
        onPress={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  errorBox: { padding: spacing.md, borderRadius: radius, backgroundColor: colors.errorSurface },
});
