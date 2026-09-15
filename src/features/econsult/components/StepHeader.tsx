import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useIsRelayout } from "@/components/ScreenScaffold/ScreenScaffold";
import { announce } from "@/lib/announce";
import { text } from "@/theme/text";
import { colors, fontSize, spacing, STEP_CHIP_MAX_FONT_SCALE } from "@/theme/tokens";

type Props = { stepNumber: number; stepCount: number; title: string };

// Neither platform reliably announces route changes, so each step announces itself.
export function StepHeader({ stepNumber, stepCount, title }: Props) {
  const counter = `Step ${stepNumber} of ${stepCount}`;
  const isRelayout = useIsRelayout();

  // A text-size change mounts the step a second time; the patient has not arrived on it again.
  useEffect(() => {
    if (isRelayout()) return;
    announce(`${counter}: ${title}`);
  }, [counter, isRelayout, title]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.chip} maxFontSizeMultiplier={STEP_CHIP_MAX_FONT_SCALE}>
        {counter}
      </Text>
      <Text accessibilityRole="header" style={text.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chip: {
    alignSelf: "flex-start",
    color: colors.muted,
    fontSize: fontSize.small,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
