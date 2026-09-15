import { screen } from "@testing-library/react-native";
import { Keyboard, Platform, StyleSheet, Text } from "react-native";
import {
  addKeyboardListener,
  androidKeyboardFrame,
  emitKeyboardEvent,
  emitKeyboardFrame,
  emptyKeyboardFrame,
  KEYBOARD_TOP,
  keyboardFrame,
  removeKeyboardListener,
  WINDOW_HEIGHT,
} from "@/test/keyboard";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ScreenScaffold } from "./ScreenScaffold";

function roomBelowContent(): number {
  return StyleSheet.flatten(screen.getByTestId("scaffold").props.contentContainerStyle)
    .paddingBottom;
}

// iOS hands every scroll view the frame of every keyboard on the device, its own app's or another
// app's; the photo picker's runs out of process and reports a frame that covers the whole screen.
describe("useKeyboardInset", () => {
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

  // Expo Go on Android keeps the window at its size under the keyboard, and reports the keyboard
  // only once it is up, as the height it covers above the navigation bar.
  describe("on Android", () => {
    let original: typeof Platform.OS;

    beforeEach(() => {
      original = Platform.OS;
      Platform.OS = "android";
    });

    afterEach(() => {
      Platform.OS = original;
    });

    test("makes room below the content for the height the keyboard reports", () => {
      renderWithProviders(
        <ScreenScaffold testID="scaffold">
          <Text>Body</Text>
        </ScreenScaffold>,
      );
      const closed = roomBelowContent();

      emitKeyboardEvent("keyboardDidShow", androidKeyboardFrame(KEYBOARD_TOP));

      expect(roomBelowContent()).toBe(closed + WINDOW_HEIGHT - KEYBOARD_TOP);
    });

    test("takes the room back once the keyboard has hidden", () => {
      renderWithProviders(
        <ScreenScaffold testID="scaffold">
          <Text>Body</Text>
        </ScreenScaffold>,
      );
      const closed = roomBelowContent();

      emitKeyboardEvent("keyboardDidShow", androidKeyboardFrame(KEYBOARD_TOP));
      emitKeyboardEvent("keyboardDidHide", androidKeyboardFrame(WINDOW_HEIGHT));

      expect(roomBelowContent()).toBe(closed);
    });
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
