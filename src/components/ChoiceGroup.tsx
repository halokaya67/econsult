import type { Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";
import { accessibleName, labelWithRequirement, type Requirement } from "./TextField";

type Props = {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  requirement?: Requirement;
  error?: string | null;
  ref?: Ref<View>;
};

const DOT_SIZE = 24;

// The group View carries the role and name but is deliberately not `accessible`: making it one
// element would swallow its radios. The ref lands on the first option, the element a screen
// reader can land on, so a validation failure can move focus into the group.
export function ChoiceGroup({ label, options, value, onChange, requirement, error, ref }: Props) {
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{visibleLabel}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibleName(visibleLabel, error)}
        style={styles.group}
      >
        {options.map((option, index) => {
          const checked = option === value;
          return (
            <Pressable
              key={option}
              ref={index === 0 ? ref : undefined}
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
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
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
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.background,
  },
  optionChecked: { borderColor: colors.primary, backgroundColor: colors.selected },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { flex: 1, color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
  error: { color: colors.error, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
