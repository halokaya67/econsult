import { Link, Stack } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { text } from "@/theme/text";
import { colors, fontSize, MIN_TOUCH } from "@/theme/tokens";

const TITLE = "Page not found";
const BODY = "That address isn't part of this app.";
const HOME_LABEL = "Go to the home screen";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: TITLE }} />
      <ScreenScaffold>
        <Text accessibilityRole="header" style={text.title}>
          {TITLE}
        </Text>
        <Text style={text.body}>{BODY}</Text>
        <Link href="/" style={styles.link}>
          {HOME_LABEL}
        </Link>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  // The line box is the link's touch target, so it is the 48-point minimum rather than a reading
  // line height.
  link: {
    color: colors.primary,
    fontSize: fontSize.body,
    lineHeight: MIN_TOUCH,
    fontWeight: "600",
  },
});
