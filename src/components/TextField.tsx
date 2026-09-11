import type { Ref } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";

export type Requirement = "required" | "optional";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  error?: string | null;
  requirement?: Requirement;
  multiline?: boolean;
  editable?: boolean;
  ref?: Ref<TextInput>;
  testID?: string;
};

export function labelWithRequirement(label: string, requirement?: Requirement): string {
  return requirement ? `${label} (${requirement})` : label;
}

// Neither platform supports an error-message link on inputs, so the error is folded into the
// field's accessible name: the one mechanism that works identically for VoiceOver and TalkBack.
export function accessibleName(label: string, error?: string | null): string {
  return error ? `${label}. Error: ${error}` : label;
}

const MULTILINE_MIN_HEIGHT = 132;

export function TextField({
  label,
  value,
  onChangeText,
  hint,
  error,
  requirement,
  multiline = false,
  editable = true,
  ref,
  testID,
}: Props) {
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View style={styles.wrap}>
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
        style={[styles.input, multiline && styles.multiline, Boolean(error) && styles.inputError]}
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
  multiline: { minHeight: MULTILINE_MIN_HEIGHT },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
