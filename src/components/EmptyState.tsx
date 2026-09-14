import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { text } from "@/theme/text";
import { spacing } from "@/theme/tokens";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={text.heading}>
        {title}
      </Text>
      <Text style={text.body}>{body}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
