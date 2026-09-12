import { StyleSheet, Text, View } from "react-native";
import { OFFLINE_MESSAGE } from "@/lib/network";
import { colors, fontSize, lineHeight, radius, spacing } from "@/theme/tokens";

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
