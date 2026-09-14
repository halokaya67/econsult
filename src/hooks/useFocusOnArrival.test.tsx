import { render } from "@testing-library/react-native";
import { useRef } from "react";
import { AccessibilityInfo, Text } from "react-native";
import type { Focusable } from "@/lib/announce";
import { useFocusOnArrival, type ArrivalNavigation } from "./useFocusOnArrival";

function HeadingProbe({ navigation }: { navigation: ArrivalNavigation }) {
  const heading = useRef<Focusable | null>(null);
  useFocusOnArrival(navigation, heading);
  return (
    <Text
      ref={(node) => {
        heading.current = node;
      }}
      accessibilityRole="header"
    >
      Message sent
    </Text>
  );
}

// Stands in for the native stack: it reports the end of a transition only when one happened.
function fakeStack() {
  const listeners: (() => void)[] = [];
  const unsubscribe = jest.fn();
  const navigation: ArrivalNavigation = {
    addListener: jest.fn((_type, listener) => {
      listeners.push(listener);
      return unsubscribe;
    }),
  };
  return { navigation, unsubscribe, endTransition: () => listeners.forEach((run) => run()) };
}

describe("useFocusOnArrival", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("waits for the stack to report the screen has appeared before focusing", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    const stack = fakeStack();
    render(<HeadingProbe navigation={stack.navigation} />);

    expect(focus).not.toHaveBeenCalled();
    stack.endTransition();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(expect.any(Text), "focus");
  });

  test("focuses anyway when no transition is ever reported", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    const stack = fakeStack();
    render(<HeadingProbe navigation={stack.navigation} />);

    jest.runOnlyPendingTimers();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  test("focuses once when the fallback and the transition both come round", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    const stack = fakeStack();
    render(<HeadingProbe navigation={stack.navigation} />);

    stack.endTransition();
    jest.runOnlyPendingTimers();
    stack.endTransition();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  test("stops listening and drops the fallback when the screen goes away", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    const stack = fakeStack();
    const view = render(<HeadingProbe navigation={stack.navigation} />);

    view.unmount();
    jest.runOnlyPendingTimers();

    expect(stack.unsubscribe).toHaveBeenCalledTimes(1);
    expect(focus).not.toHaveBeenCalled();
  });
});
