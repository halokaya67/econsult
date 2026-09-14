import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

export const RETRY_LABEL = "Try again";

const PLACEHOLDER_COUNT = 3;
const PLACEHOLDER_HEIGHT = 72;

export function LoadingCards({ label }: { label: string }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={styles.stack}
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <View key={index} style={styles.placeholder} />
      ))}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={text.heading}>
        {title}
      </Text>
      <Text style={text.body}>{body}</Text>
      {action}
    </View>
  );
}

// The alert groups only the two texts; the retry button stays a sibling so it remains its own
// element. A blocking reason disables Retry and is spoken as its hint, so the block is never silent.
export function ErrorState({
  title,
  body,
  onRetry,
  retryBlockedReason,
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retryBlockedReason?: string;
}) {
  return (
    <View style={[styles.stack, styles.errorBox]}>
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
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
  placeholder: {
    height: PLACEHOLDER_HEIGHT,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
  errorBox: { padding: spacing.md, borderRadius: radius, backgroundColor: colors.errorSurface },
});
