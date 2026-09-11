import { Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { STEP_TITLES } from "@/features/econsult/steps";

export default function MessageScreen() {
  return (
    <ScreenScaffold>
      <Text accessibilityRole="header">{STEP_TITLES.message}</Text>
    </ScreenScaffold>
  );
}
