import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme/tokens";

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

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  placeholder: {
    height: PLACEHOLDER_HEIGHT,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
});
