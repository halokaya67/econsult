import { Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";

export default function SentScreen() {
  return (
    <ScreenScaffold>
      <Text accessibilityRole="header">Message sent</Text>
    </ScreenScaffold>
  );
}
