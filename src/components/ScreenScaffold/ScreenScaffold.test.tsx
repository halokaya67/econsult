import { fireEvent, screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { useEffect, useRef } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OFFLINE_MESSAGE } from "@/lib/copy";
import { RelayoutProbe } from "@/test/relayoutProbe";
import { renderWithProviders } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";
import { ScreenScaffold, useScrollToField } from "./ScreenScaffold";

// Jest renders no layout, so the hook the scaffold reads the text size from is the only place a
// live Dynamic Type change can be simulated; every test outside that one keeps the real metrics.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

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

// A mount counter: a remount runs the effect again, which is the evidence of a fresh layout pass.
function MountProbe({ onMount }: { onMount: () => void }) {
  useEffect(() => onMount(), [onMount]);
  return <Text>Body</Text>;
}

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

const WINDOW = Dimensions.get("window");

const mockedWindow = jest.mocked(useWindowDimensions);

beforeEach(() => {
  mockedWindow.mockReturnValue(WINDOW);
});

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

// Changing the system text size while the app runs repaints the glyphs but leaves the layout boxes
// at the size they were measured at, so the scaffold remounts its content to force a new pass.
describe("ScreenScaffold and the system text size", () => {
  test("lays its content out again when the system text size changes", () => {
    const onMount = jest.fn();
    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 1 });
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <MountProbe onMount={onMount} />
      </ScreenScaffold>,
    );

    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 2 });
    rerender(
      <ScreenScaffold>
        <MountProbe onMount={onMount} />
      </ScreenScaffold>,
    );

    expect(onMount).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Body")).toBeOnTheScreen();
  });

  test("leaves its content mounted while the text size stays the same", () => {
    const onMount = jest.fn();
    mockedWindow.mockReturnValue({ ...WINDOW, fontScale: 1 });
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <MountProbe onMount={onMount} />
      </ScreenScaffold>,
    );

    rerender(
      <ScreenScaffold>
        <MountProbe onMount={onMount} />
      </ScreenScaffold>,
    );

    expect(onMount).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Body")).toBeOnTheScreen();
  });
});

describe("useIsRelayout", () => {
  test("tells a child outside a scaffold that its mount is an arrival", () => {
    const report = jest.fn();

    renderWithProviders(<RelayoutProbe report={report} />);

    expect(report).toHaveBeenCalledWith(false);
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
