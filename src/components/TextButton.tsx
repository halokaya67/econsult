import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  maxFontSizeMultiplier?: number;
  testID?: string;
};

export function TextButton({
  label,
  onPress,
  disabled = false,
  accessibilityHint,
  maxFontSizeMultiplier,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={maxFontSizeMultiplier}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.6 },
  label: {
    color: colors.primary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
  },
});
