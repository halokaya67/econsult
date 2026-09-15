import { StyleSheet, Text, View } from "react-native";
import { TextButton } from "@/components/TextButton";
import { colors, fontSize, lineHeight, spacing } from "@/theme/tokens";

type Props = { name: string; disabled: boolean; onChange: () => void };

export const CHANGE_HINT = "Choose a different person";

export function ToRow({ name, disabled, onChange }: Props) {
  return (
    <View style={styles.toRow}>
      <Text style={styles.to}>To: {name}</Text>
      <TextButton
        label="Change"
        disabled={disabled}
        accessibilityHint={CHANGE_HINT}
        onPress={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  to: {
    flexShrink: 1,
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
  },
});
