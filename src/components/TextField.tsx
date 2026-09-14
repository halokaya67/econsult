import type { Ref } from "react";
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";
import { accessibleName, labelWithRequirement, type Requirement } from "./fieldLabel";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  error?: string | null;
  requirement?: Requirement;
  multiline?: boolean;
  editable?: boolean;
  // The container is the scroll anchor and the input the screen-reader focus target: at large text
  // sizes the label sits far above the box, so scrolling to the box alone hides the question.
  containerRef?: Ref<View>;
  ref?: Ref<TextInput>;
  testID?: string;
};

export const MULTILINE_MIN_HEIGHT = 132;

export function TextField({
  label,
  value,
  onChangeText,
  hint,
  error,
  requirement,
  multiline = false,
  editable = true,
  containerRef,
  ref,
  testID,
}: Props) {
  // Text inside the box grows with the system font scale, so its minimum height has to grow too.
  const { fontScale } = useWindowDimensions();
  const multilineStyle = { minHeight: MULTILINE_MIN_HEIGHT * fontScale };
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View ref={containerRef} style={styles.wrap}>
      <Text style={styles.label}>{visibleLabel}</Text>
      {hint ? <Text style={text.muted}>{hint}</Text> : null}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={accessibleName(visibleLabel, error)}
        accessibilityHint={hint}
        style={[styles.input, multiline && multilineStyle, Boolean(error) && styles.inputError]}
        testID={testID}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    color: colors.text,
    fontSize: fontSize.large,
    lineHeight: lineHeight.heading,
    fontWeight: "600",
  },
  input: {
    minHeight: MIN_TOUCH + spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
