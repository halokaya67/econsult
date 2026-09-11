import { AccessibilityInfo } from "react-native";
import { announce, focusForScreenReader, type Focusable } from "./announce";

// The RN jest preset ships AccessibilityInfo as ready-made jest.fn()s, so jest.spyOn hands back
// that same mock and its calls would leak into the next test without a clear.
afterEach(() => jest.clearAllMocks());

describe("announce", () => {
  test("hands the message to the screen reader", () => {
    const spy = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});

    announce("Step 1 of 3");

    expect(spy).toHaveBeenCalledWith("Step 1 of 3");
  });
});

describe("focusForScreenReader", () => {
  test("moves screen-reader focus to the node", () => {
    const spy = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    const node = {} as Focusable;

    focusForScreenReader(node);

    expect(spy).toHaveBeenCalledWith(node, "focus");
  });

  test("does nothing for a missing node", () => {
    const spy = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});

    focusForScreenReader(null);

    expect(spy).not.toHaveBeenCalled();
  });
});
