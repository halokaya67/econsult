import { onlineManager, QueryClient } from "@tanstack/react-query";
import { userEvent, within } from "@testing-library/react-native";
import { router, Stack } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import { DEFAULT_PRACTICE_ID } from "@/api/fake/fixtures";
import DevSettingsScreen from "@/app/dev-settings";
import * as devWarn from "@/lib/devWarn";
import { useDevSettings } from "@/providers/DevSettingsProvider";
import { useIsOffline } from "@/providers/NetworkProvider";
import { TestProviders } from "@/test/renderWithProviders";

// The screen labels a practice with what its fixture holds; the test speaks the same words.
const PRACTICE_0873 = "prc-0873: two recipients, no questions";

// Reads the network context as well as the settings, so Apply with Force offline is observable.
function HomeProbe() {
  const { settings } = useDevSettings();
  const isOffline = useIsOffline();
  return (
    <Text>{`home:${settings.practiceId}:${settings.latencyMs}:${settings.faults.config ?? "-"}:${settings.forceOffline}:${isOffline}`}</Text>
  );
}

// A Stack layout so the screen's header options, including the Cancel button, are part of the tree.
function TestLayout() {
  return <Stack />;
}

function renderDevSettings(client = new QueryClient(), initialUrl = "/dev-settings") {
  return renderRouter(
    { _layout: TestLayout, index: HomeProbe, "dev-settings": DevSettingsScreen },
    {
      initialUrl,
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    },
  );
}

describe("Developer settings screen", () => {
  // Applying forceOffline can leave react-query's shared online manager offline, which would pause
  // the reads of every test rendered after it.
  afterEach(() => {
    jest.restoreAllMocks();
    onlineManager.setOnline(true);
  });

  test("applies the chosen practice, latency, fault and offline flag, clears the cache and goes home", async () => {
    const client = new QueryClient();
    const clear = jest.spyOn(client, "clear");
    const user = userEvent.setup();
    renderDevSettings(client);

    await user.press(screen.getByRole("radio", { name: PRACTICE_0873 }));
    await user.press(screen.getByRole("radio", { name: "Slow (5 seconds)" }));
    await user.press(screen.getAllByRole("radio", { name: "Server" })[0]);
    await user.press(screen.getByRole("switch", { name: "Force offline" }));
    await user.press(screen.getByRole("button", { name: "Apply and go home" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
    expect(screen.getByText("home:prc-0873:5000:server:true:true")).toBeOnTheScreen();
    expect(clear).toHaveBeenCalled();
  });

  test("a fault put back to None leaves its request unfaulted", async () => {
    const user = userEvent.setup();
    renderDevSettings();
    // Both the label's wrapper and the radiogroup carry the group's name; the radios are in the
    // second of them.
    const configFault = (name: string) => {
      const [, group] = screen.getAllByLabelText("Fail: Practice config");
      return within(group).getByRole("radio", { name });
    };

    await user.press(configFault("Server"));
    await user.press(configFault("None"));
    await user.press(screen.getByRole("button", { name: "Apply and go home" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
    expect(screen.getByText(`home:${DEFAULT_PRACTICE_ID}:0:-:false:false`)).toBeOnTheScreen();
  });

  test("Cancel discards the draft settings, keeps the cache and returns home", async () => {
    const client = new QueryClient();
    const clear = jest.spyOn(client, "clear");
    const user = userEvent.setup();
    renderDevSettings(client, "/");
    act(() => router.push("/dev-settings"));
    await waitFor(() => expect(screen).toHavePathname("/dev-settings"));

    await user.press(screen.getByRole("radio", { name: PRACTICE_0873 }));
    await user.press(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
    expect(screen.getByText(`home:${DEFAULT_PRACTICE_ID}:0:-:false:false`)).toBeOnTheScreen();
    expect(clear).not.toHaveBeenCalled();
  });

  test("the offline row lets its label wrap and keeps the switch centred", () => {
    renderDevSettings();

    expect(screen.getByText("Force offline")).toHaveStyle({ flex: 1 });
    // The switch is hidden from accessibility on purpose, so the query has to include it.
    expect(screen.getByTestId("force-offline-switch", { includeHiddenElements: true })).toHaveStyle(
      { alignSelf: "center" },
    );
  });

  test("redirects home outside development", async () => {
    jest.spyOn(devWarn, "isDevelopmentBuild").mockReturnValue(false);
    renderDevSettings();

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
