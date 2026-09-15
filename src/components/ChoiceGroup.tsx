import type { Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { accessibleName, labelWithRequirement, type Requirement } from "@/lib/fieldLabel";
import {
  borderWidth,
  colors,
  fontSize,
  lineHeight,
  MIN_TOUCH,
  radius,
  spacing,
} from "@/theme/tokens";

// A plain string option is its own label; anything else names a value the caller applies directly.
export type Choice<T> = { label: string; value: T };

type Props<T> = {
  label: string;
  options: readonly (T | Choice<T>)[];
  value: T | null;
  onChange: (value: T) => void;
  requirement?: Requirement;
  error?: string | null;
  ref?: Ref<View>;
};

const DOT_SIZE = 24;

// The group View carries role and name for TalkBack but is not `accessible`, which would swallow
// its radios; iOS has no group element, so the label's wrapper folds in the error and takes the ref.
// The error sits between label and radios so it stays visible when a tall label is scrolled to.
export function ChoiceGroup<T>({
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
      {/* Named unconditionally: Android never clears a contentDescription that goes back to
          undefined, so a corrected answer would keep announcing its old error. iOS caches the name
          it first reads off a Text, so the wrapper is named and the Text left to its own words. */}
      <View ref={ref} accessible accessibilityLabel={accessibleName(visibleLabel, error)}>
        <Text style={styles.label}>{visibleLabel}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={visibleLabel} style={styles.group}>
        {options.map((option) => {
          // typeof cannot subtract string from an unconstrained T, so the pair side is asserted.
          const choice =
            typeof option === "string" ? { label: option, value: option } : (option as Choice<T>);
          const checked = choice.value === value;
          return (
            <Pressable
              key={choice.label}
              accessibilityRole="radio"
              accessibilityLabel={choice.label}
              accessibilityState={{ checked }}
              onPress={() => onChange(choice.value)}
              style={[styles.option, checked && styles.optionChecked]}
            >
              <View style={[styles.dot, checked && styles.dotChecked]} />
              <Text style={styles.optionText}>{choice.label}</Text>
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
