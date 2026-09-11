import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  busyLabel = "Please wait",
  accessibilityHint,
  testID,
}: Props) {
  const isInactive = disabled || busy;
  const shownLabel = busy ? busyLabel : label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shownLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy }}
      disabled={isInactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        isInactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={colors.onPrimary} /> : null}
      <Text style={styles.label}>{shownLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius,
    backgroundColor: colors.primary,
  },
  inactive: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.85 },
  label: {
    color: colors.onPrimary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
    textAlign: "center",
  },
});
