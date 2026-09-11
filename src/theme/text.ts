import { StyleSheet } from "react-native";
import { colors, fontSize, lineHeight } from "./tokens";

export const text = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
    fontWeight: "700",
  },
  heading: {
    color: colors.text,
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
    fontWeight: "700",
  },
  body: { color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
  muted: { color: colors.muted, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
