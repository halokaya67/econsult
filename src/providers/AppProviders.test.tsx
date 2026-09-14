import { onlineManager, QueryClient, useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import type { DevSettings } from "@/features/devSettings/utils/settings";
import { AppProviders } from "./AppProviders";
import { useDevSettings } from "./DevSettingsProvider";
import { useIsOffline } from "./NetworkProvider";
import { useServices } from "./ServicesProvider";
import { useSession } from "./session";

const SETTINGS: DevSettings = {
  practiceId: "prc-0873",
  latencyMs: 0,
  faults: {},
  forceOffline: false,
};

// Reads every context the stack is meant to provide, so a missing provider fails the render.
function Probe() {
  const { settings } = useDevSettings();
  const hasClient = useQueryClient() !== undefined;
  const hasServices = typeof useServices().getPracticeConfig === "function";
  return (
    <Text>{`practice:${settings.practiceId} session:${useSession().practiceId} client:${hasClient} services:${hasServices} offline:${useIsOffline()}`}</Text>
  );
}

function renderProbe(initialSettings: DevSettings) {
  return render(
    <AppProviders queryClient={new QueryClient()} initialSettings={initialSettings}>
      <Probe />
    </AppProviders>,
  );
}

describe("AppProviders", () => {
  // NetworkProvider drives react-query's shared online manager, which would otherwise pause the
  // reads of every test rendered after this one.
  afterEach(() => onlineManager.setOnline(true));

  test("provides the settings, the query client, the services and the session in one stack", () => {
    renderProbe(SETTINGS);

    expect(
      screen.getByText(
        "practice:prc-0873 session:prc-0873 client:true services:true offline:false",
      ),
    ).toBeOnTheScreen();
  });

  test("the network state follows the settings rather than a separate prop", () => {
    renderProbe({ ...SETTINGS, forceOffline: true });

    expect(screen.getByText(/offline:true/)).toBeOnTheScreen();
  });
});
