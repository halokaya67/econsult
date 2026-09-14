import type { Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  borderWidth,
  colors,
  fontSize,
  lineHeight,
  MIN_TOUCH,
  radius,
  spacing,
} from "@/theme/tokens";
import { accessibleName, labelWithRequirement, type Requirement } from "./fieldLabel";

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  requirement?: Requirement;
  error?: string | null;
  ref?: Ref<Text>;
};

const DOT_SIZE = 24;

// The group View carries role and name for TalkBack but is not `accessible`, which would swallow
// its radios; iOS has no group element, so the label Text folds in the error and takes the ref.
// The error sits between label and radios so it stays visible when a tall label is scrolled to.
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  requirement,
  error,
  ref,
}: Props<T>) {
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View style={styles.wrap}>
      <Text
        ref={ref}
        accessibilityLabel={error ? accessibleName(visibleLabel, error) : undefined}
        style={styles.label}
      >
        {visibleLabel}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={visibleLabel} style={styles.group}>
        {options.map((option) => {
          const checked = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ checked }}
              onPress={() => onChange(option)}
              style={[styles.option, checked && styles.optionChecked]}
            >
              <View style={[styles.dot, checked && styles.dotChecked]} />
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    color: colors.text,
    fontSize: fontSize.large,
    lineHeight: lineHeight.heading,
    fontWeight: "600",
  },
  group: { gap: spacing.sm },
  option: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.background,
  },
  optionChecked: { borderColor: colors.primary, backgroundColor: colors.selected },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth,
    borderColor: colors.border,
  },
  dotChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { flex: 1, color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
  error: {
    color: colors.error,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    marginBottom: spacing.xs,
  },
});
