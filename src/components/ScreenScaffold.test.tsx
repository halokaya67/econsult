import { fireEvent, screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { useRef } from "react";
import { AccessibilityInfo, Platform, ScrollView, Text } from "react-native";
import { renderWithProviders } from "@/test/providers";
import { spacing } from "@/theme/tokens";
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE } from "./OfflineBanner";
import { ScreenScaffold, useScrollToField } from "./ScreenScaffold";

const mockedState = jest.mocked(Network.useNetworkState);

// The jest ScrollView and Text mocks expose every native method as a shared jest.fn, so the real
// measure-then-scroll path can be driven end to end.
const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
const getInnerViewNode = jest.mocked(ScrollView.prototype.getInnerViewNode);
// getInnerViewRef is mocked by the jest preset but missing from ScrollView's types.
const getInnerViewRef = jest.mocked(
  (ScrollView.prototype as ScrollView & { getInnerViewRef: () => unknown }).getInnerViewRef,
);
const measureLayout = jest.mocked(Text.prototype.measureLayout);

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
const FIELD_TOP = 480;

function FieldProbe({ withNode = true }: { withNode?: boolean }) {
  const scrollToField = useScrollToField();
  const fieldRef = useRef<Text>(null);
  return (
    <Text ref={fieldRef} onPress={() => scrollToField(withNode ? fieldRef.current : null)}>
      Field
    </Text>
  );
}

describe("ScreenScaffold", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewNode.mockReset();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
  });

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

  test("scrolls a field into view with a margin above it", () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, FIELD_TOP, 300, 40));
    renderWithProviders(
      <ScreenScaffold>
        <FieldProbe />
      </ScreenScaffold>,
    );

    fireEvent.press(screen.getByText("Field"));

    expect(measureLayout).toHaveBeenCalledWith(CONTENT_REF, expect.any(Function));
    // A node handle is silently ignored by measureLayout under the New Architecture.
    expect(getInnerViewNode).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({
      x: 0,
      y: FIELD_TOP - spacing.md,
      animated: true,
    });
  });

  test("stays put when the field it is asked to scroll to is not mounted", () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    renderWithProviders(
      <ScreenScaffold>
        <FieldProbe withNode={false} />
      </ScreenScaffold>,
    );

    fireEvent.press(screen.getByText("Field"));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("scrolling to a field outside a scaffold does nothing", () => {
    renderWithProviders(<FieldProbe />);

    fireEvent.press(screen.getByText("Field"));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
