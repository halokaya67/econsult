import { useEffect } from "react";
import { Text } from "react-native";
import { useIsRelayout } from "@/components/ScreenScaffold/ScreenScaffold";

// Reports what the scaffold answers, from a mount effect and from a press later on; the answer is
// only readable after the commit, so a child asks for it the way the real ones do.
export function RelayoutProbe({ report }: { report: (isRelayout: boolean) => void }) {
  const isRelayout = useIsRelayout();
  useEffect(() => report(isRelayout()), [isRelayout, report]);
  return <Text onPress={() => report(isRelayout())}>Probe</Text>;
}
