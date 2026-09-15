import type { Ref } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { RETRY_LABEL } from "@/lib/copy";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

// The name is the card's only spoken channel, since whoever shows the card moves screen-reader
// focus to it. Without an explicit label iOS splices the grouped texts with a comma, which reads
// as one run-on sentence.
function alertName(title: string, body: string): string {
  return `${title.endsWith(".") ? title : `${title}.`} ${body}`;
}

// The alert groups only the two texts; the retry button stays a sibling so it remains its own
// element. A blocking reason disables Retry and is spoken as its hint, so the block is never silent.
export function ErrorState({
  title,
  body,
  onRetry,
  retryBlockedReason,
  ref,
  onLayout,
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retryBlockedReason?: string;
  // The ref lands on the alert, the element a caller scrolls to and moves screen-reader focus to.
  ref?: Ref<View>;
  // Its first layout is when the alert exists natively, so a caller that focuses it waits for this.
  onLayout?: ViewProps["onLayout"];
}) {
  const name = alertName(title, body);

  return (
    <View style={[styles.stack, styles.errorBox]}>
      <View
        ref={ref}
        onLayout={onLayout}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={name}
        style={styles.stack}
      >
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
