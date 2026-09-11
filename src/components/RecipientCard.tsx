import { Pressable, StyleSheet, Text, View } from "react-native";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, radius, spacing } from "@/theme/tokens";

type Props = { name: string; role: string; checked: boolean; onPress: () => void };

const CARD_MIN_HEIGHT = 64;
const INDICATOR_SIZE = 28;

export function RecipientCard({ name, role, checked, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${name}, ${role}`}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.card, checked && styles.cardChecked]}
    >
      <View style={styles.texts}>
        <Text style={styles.name}>{name}</Text>
        <Text style={text.muted}>{role}</Text>
      </View>
      <View style={[styles.indicator, checked && styles.indicatorChecked]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.background,
  },
  cardChecked: { borderColor: colors.primary, backgroundColor: colors.selected },
  texts: { flex: 1, gap: spacing.xs },
  name: {
    color: colors.text,
    fontSize: fontSize.large,
    lineHeight: lineHeight.heading,
    fontWeight: "600",
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  indicatorChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
});
