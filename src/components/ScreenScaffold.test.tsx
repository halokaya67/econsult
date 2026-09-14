import { act, fireEvent, screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { useRef } from "react";
import { Dimensions, Keyboard, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OFFLINE_MESSAGE } from "@/providers/NetworkProvider";
import { renderWithProviders } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";
import { ScreenScaffold, useScrollToField } from "./ScreenScaffold";

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

const mockedState = jest.mocked(Network.useNetworkState);

const addKeyboardListener = jest.spyOn(Keyboard, "addListener");
const removeKeyboardListener = jest.fn();

type KeyboardListener = Parameters<typeof Keyboard.addListener>[1];
type KeyboardFrame = Parameters<KeyboardListener>[0];

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const KEYBOARD_TOP = Math.round(WINDOW_HEIGHT / 2);

// The frame iOS reports: its top edge in window coordinates, and whose keyboard it is.
function keyboardFrame(screenY: number, isEventFromThisApp: boolean): KeyboardFrame {
  return {
    duration: 250,
    easing: "keyboard",
    isEventFromThisApp,
    startCoordinates: { screenX: 0, screenY: WINDOW_HEIGHT, width: WINDOW_WIDTH, height: 0 },
    endCoordinates: {
      screenX: 0,
      screenY,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT - screenY,
    },
  };
}

// What the iPadOS photo picker reports on dismissal: an empty frame at the window origin, from this
// app, which taken at face value insets the content by a whole window.
function emptyKeyboardFrame(): KeyboardFrame {
  return {
    duration: 250,
    easing: "keyboard",
    isEventFromThisApp: true,
    startCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
    endCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
  };
}

function emitKeyboardEvent(eventType: string, frame: KeyboardFrame): void {
  const listener = addKeyboardListener.mock.calls
    .filter(([type]) => type === eventType)
    .at(-1)?.[1];
  expect(listener).toBeDefined();
  act(() => listener?.(frame));
}

function emitKeyboardFrame(frame: KeyboardFrame): void {
  emitKeyboardEvent("keyboardWillChangeFrame", frame);
}

function roomBelowContent(): number {
  return StyleSheet.flatten(screen.getByTestId("scaffold").props.contentContainerStyle)
    .paddingBottom;
}

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

// iOS hands every scroll view the frame of every keyboard on the device, its own app's or another
// app's; the photo picker's runs out of process and reports a frame that covers the whole screen.
describe("ScreenScaffold and the keyboard", () => {
  beforeEach(() => {
    addKeyboardListener.mockClear();
    removeKeyboardListener.mockClear();
    addKeyboardListener.mockReturnValue({
      remove: removeKeyboardListener,
    } as unknown as ReturnType<typeof Keyboard.addListener>);
  });

  test("makes room below the content for the part this app's keyboard covers", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
    const closed = roomBelowContent();

    emitKeyboardFrame(keyboardFrame(KEYBOARD_TOP, true));

    expect(roomBelowContent()).toBe(closed + WINDOW_HEIGHT - KEYBOARD_TOP);
  });

  test("leaves the content alone for a keyboard that belongs to another app", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
    const closed = roomBelowContent();

    emitKeyboardFrame(keyboardFrame(0, false));

    expect(roomBelowContent()).toBe(closed);
  });

  test("takes the room back when the keyboard goes away", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
    const closed = roomBelowContent();

    emitKeyboardFrame(keyboardFrame(KEYBOARD_TOP, true));
    emitKeyboardFrame(keyboardFrame(WINDOW_HEIGHT, true));

    expect(roomBelowContent()).toBe(closed);
  });

  test("ignores the empty frame the photo picker reports, which covers nothing", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
    const closed = roomBelowContent();

    emitKeyboardFrame(emptyKeyboardFrame());

    expect(roomBelowContent()).toBe(closed);
  });

  test("takes the room back when the keyboard is told to hide", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
    const closed = roomBelowContent();

    emitKeyboardFrame(keyboardFrame(KEYBOARD_TOP, true));
    emitKeyboardEvent("keyboardWillHide", keyboardFrame(WINDOW_HEIGHT, true));

    expect(roomBelowContent()).toBe(closed);
  });

  test("leaves the room to the window on Android, which resizes it itself", () => {
    const original = Platform.OS;
    Platform.OS = "android";

    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(addKeyboardListener).not.toHaveBeenCalled();
    Platform.OS = original;
  });

  test("stops listening once the screen is gone", () => {
    const { unmount } = renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    unmount();

    expect(removeKeyboardListener).toHaveBeenCalled();
  });
});

describe("useScrollToField", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewNode.mockReset();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
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

  test("does nothing when it is called outside a scaffold", () => {
    renderWithProviders(<FieldProbe />);

    fireEvent.press(screen.getByText("Field"));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
