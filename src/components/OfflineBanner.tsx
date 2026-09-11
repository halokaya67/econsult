import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, lineHeight, radius, spacing } from "@/theme/tokens";

export const OFFLINE_MESSAGE =
  "You're offline. You can keep writing, but sending needs a connection.";
export const BACK_ONLINE_MESSAGE = "You're back online.";

// Text only, so grouping it into one accessibility element is safe and makes the role queryable.
export function OfflineBanner() {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.banner}
    >
      <Text style={styles.text}>{OFFLINE_MESSAGE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSurface,
    borderRadius: radius,
    padding: spacing.md,
  },
  text: { color: colors.warning, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
