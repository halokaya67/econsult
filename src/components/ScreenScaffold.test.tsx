import { screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { Platform, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OFFLINE_MESSAGE } from "@/providers/NetworkProvider";
import { renderWithProviders } from "@/test/providers";
import { spacing } from "@/theme/tokens";
import { ScreenScaffold } from "./ScreenScaffold";

const mockedState = jest.mocked(Network.useNetworkState);

// A notched device on its side: the cut-out and the home indicator inset the sides, not only the
// bottom. The test wrapper's own metrics are portrait, where all three horizontal insets are 0.
const SIDEWAYS_METRICS = {
  insets: { top: 0, bottom: 21, left: 59, right: 59 },
  frame: { x: 0, y: 0, width: 852, height: 393 },
};

describe("ScreenScaffold", () => {
  afterEach(() => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
  });

  test("renders its content and its action inside a scroll view that keeps taps", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold" action={<Text>Action</Text>}>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByText("Body")).toBeOnTheScreen();
    expect(screen.getByText("Action")).toBeOnTheScreen();
    expect(screen.getByTestId("scaffold").props.keyboardShouldPersistTaps).toBe("handled");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // Announcing the transition belongs to NetworkProvider, so it is asserted in NetworkProvider.test.tsx.
  test("shows the offline banner while the link is down", () => {
    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });

    renderWithProviders(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
  });

  test("keeps its content clear of the safe area on every edge it can be inset on", () => {
    renderWithProviders(
      <SafeAreaProvider initialMetrics={SIDEWAYS_METRICS}>
        <ScreenScaffold testID="scaffold">
          <Text>Body</Text>
        </ScreenScaffold>
      </SafeAreaProvider>,
    );

    const content = StyleSheet.flatten(screen.getByTestId("scaffold").props.contentContainerStyle);

    expect(content.paddingLeft).toBe(spacing.md + SIDEWAYS_METRICS.insets.left);
    expect(content.paddingRight).toBe(spacing.md + SIDEWAYS_METRICS.insets.right);
    expect(content.paddingBottom).toBe(spacing.lg + SIDEWAYS_METRICS.insets.bottom);
  });

  test("uses drag-to-dismiss on Android and interactive dismissal on iOS", () => {
    const original = Platform.OS;
    Platform.OS = "android";
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByTestId("scaffold").props.keyboardDismissMode).toBe("on-drag");

    Platform.OS = original;
  });
});
