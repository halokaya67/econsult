import { Stack, useRouter } from "expo-router";
import { Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { text } from "@/theme/text";

const TITLE = "Page not found";
const BODY = "That address isn't part of this app.";
const HOME_LABEL = "Go to the home screen";

// A button, not a Link: expo-router renders a Link as plain text on Android, with no role and no
// click action, so the one way off this screen was skipped by TalkBack.
export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: TITLE }} />
      <ScreenScaffold>
        <Text accessibilityRole="header" style={text.title}>
          {TITLE}
        </Text>
        <Text style={text.body}>{BODY}</Text>
        <TextButton label={HOME_LABEL} onPress={() => router.dismissTo("/")} />
      </ScreenScaffold>
    </>
  );
}
