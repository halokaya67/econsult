import { screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { renderWithProviders } from "@/test/providers";
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE } from "./OfflineBanner";
import { ScreenScaffold } from "./ScreenScaffold";

const mockedState = jest.mocked(Network.useNetworkState);

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

  test("shows the offline banner and announces it when the link goes down", () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    const view = renderWithProviders(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });
    view.rerender(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
    expect(announce).toHaveBeenCalledWith(OFFLINE_MESSAGE);

    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    view.rerender(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(announce).toHaveBeenCalledWith(BACK_ONLINE_MESSAGE);
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
