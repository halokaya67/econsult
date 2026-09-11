import { Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";

export default function DevSettingsScreen() {
  return (
    <ScreenScaffold>
      <Text accessibilityRole="header">Developer settings</Text>
    </ScreenScaffold>
  );
}
