import { useQueryClient } from "@tanstack/react-query";
import { renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import RootLayout from "@/app/_layout";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { useDevSettings } from "@/lib/devSettings";
import { useIsOffline } from "@/lib/network";
import { STALE_TIME_MS } from "@/lib/queryClient";
import { flowLayoutWith } from "@/test/flowLayout";

// Reads every context the root layout is meant to provide, so a missing provider fails the render.
function ProviderProbe() {
  const { settings } = useDevSettings();
  const queries = useQueryClient().getDefaultOptions().queries;
  const isOffline = useIsOffline();
  const isFixture = FIXTURE_PRACTICE_IDS.some((id) => id === settings.practiceId);
  return (
    <Text>{`practice:${isFixture} network:${queries?.networkMode} stale:${queries?.staleTime} offline:${isOffline}`}</Text>
  );
}

const Stub = () => <Text>stub</Text>;

// The nested routes the root Stack declares are registered so no screen is reported as extraneous.
function renderRootLayout() {
  return renderRouter(
    {
      _layout: RootLayout,
      index: ProviderProbe,
      "econsult/_layout": flowLayoutWith(),
      "econsult/recipient": Stub,
      "dev-settings": Stub,
    },
    { initialUrl: "/" },
  );
}

describe("RootLayout", () => {
  test("wraps its screens in the developer settings, query and network providers", () => {
    renderRootLayout();

    expect(
      screen.getByText(`practice:true network:offlineFirst stale:${STALE_TIME_MS} offline:false`),
    ).toBeOnTheScreen();
    expect(screen).toHavePathname("/");
  });
});
