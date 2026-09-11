import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { careTeamQuery, configQuery } from "@/features/econsult/queries";
import { useServices, useSession } from "@/lib/devSettings";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { text } from "@/theme/text";

const INTRO =
  "Ask your GP practice a non-urgent question. They usually reply within two working days.";

export default function HomeScreen() {
  const router = useRouter();
  const session = useSession();
  const services = useServices();
  const queryClient = useQueryClient();

  // Prefetch so the first step is usually instant; the loading state stays reachable through latency.
  useEffect(() => {
    void queryClient.prefetchQuery(configQuery(services, session.practiceId));
    void queryClient.prefetchQuery(careTeamQuery(services, session.practiceId));
  }, [queryClient, services, session.practiceId]);

  return (
    <ScreenScaffold
      action={
        <PrimaryButton
          label="Write to your practice"
          onPress={() => router.push("/econsult/recipient")}
        />
      }
    >
      <Text accessibilityRole="header" style={text.title}>
        Hello, {session.displayName}.
      </Text>
      <Text style={text.body}>{INTRO}</Text>
      {isDevelopmentBuild() ? (
        <TextButton label="Developer settings" onPress={() => router.push("/dev-settings")} />
      ) : null}
    </ScreenScaffold>
  );
}
