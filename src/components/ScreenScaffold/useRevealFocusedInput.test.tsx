import { fireEvent, screen } from "@testing-library/react-native";
import { Keyboard, Platform, ScrollView, Text, TextInput } from "react-native";
import type { Focusable } from "@/lib/announce";
import {
  addKeyboardListener,
  androidKeyboardFrame,
  emitKeyboardEvent,
  emptyKeyboardFrame,
  KEYBOARD_TOP,
  keyboardFrame,
  removeKeyboardListener,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
  type KeyboardFrame,
} from "@/test/keyboard";
import { renderWithProviders } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";
import { ScreenScaffold } from "./ScreenScaffold";

// The jest ScrollView mock exposes every native method as a shared jest.fn, so the real
// measure-then-scroll path can be driven end to end.
const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
// getInnerViewRef is mocked by the jest preset but missing from ScrollView's types.
const getInnerViewRef = jest.mocked(
  (ScrollView.prototype as ScrollView & { getInnerViewRef: () => unknown }).getInnerViewRef,
);
const getNativeScrollRef = jest.mocked(ScrollView.prototype.getNativeScrollRef);

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
const INPUT_HEIGHT = 44;
// Where the scroll view starts in the window: below the navigation header.
const VIEW_TOP = 100;

const currentlyFocusedInput = jest.spyOn(TextInput.State, "currentlyFocusedInput");

// The focused input as the reveal sees it: where it sits in the window, and where it sits in the
// scroll view's content.
type FocusedInput = Pick<Focusable, "measure" | "measureLayout">;

function inputAt(windowTop: number, contentTop: number, height = INPUT_HEIGHT): FocusedInput {
  return {
    measure: (onSuccess) => onSuccess(0, 0, 300, height, 0, windowTop),
    measureLayout: (_relativeTo, onSuccess) => onSuccess(0, contentTop, 300, height),
  };
}

// An input on a page scrolled by `offset`: its place in the content is its place in the window,
// less the scroll view's own top, plus what has already been scrolled past.
function inputOnPageAt(windowTop: number, offset: number, height = INPUT_HEIGHT): FocusedInput {
  return inputAt(windowTop, windowTop - VIEW_TOP + offset, height);
}

// The scroll view as the reveal measures it: from the header down to `bottom`, the window bottom
// on both platforms since both pad under the keyboard; a device that shrank the window instead
// would report the keyboard top.
function viewportTo(bottom: number): void {
  const viewport: Pick<Focusable, "measure"> = {
    measure: (onSuccess) => onSuccess(0, 0, WINDOW_WIDTH, bottom - VIEW_TOP, 0, VIEW_TOP),
  };
  getNativeScrollRef.mockReturnValue(viewport as ReturnType<ScrollView["getNativeScrollRef"]>);
}

// currentlyFocusedInput is typed as always returning an element, but it returns null whenever no
// input holds focus.
function focusOn(input: FocusedInput | null): void {
  currentlyFocusedInput.mockReturnValue(input as Focusable);
}

// Padding keeps Send reachable but leaves the field under the keyboard, so the page scrolls on by
// just the part the keyboard covers and the label above the field stays where it was. The keyboard
// is up by the time it is answered: iOS reports the frame before the input's focus event on a cold
// start, and on Android the window has already shrunk around it.
describe("useRevealFocusedInput", () => {
  beforeEach(() => {
    addKeyboardListener.mockClear();
    addKeyboardListener.mockReturnValue({
      remove: removeKeyboardListener,
    } as unknown as ReturnType<typeof Keyboard.addListener>);
    scrollTo.mockClear();
    getInnerViewRef.mockReset();
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    getNativeScrollRef.mockReset();
    currentlyFocusedInput.mockReset();
  });

  function renderScaffold() {
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );
  }

  function showKeyboard(frame: KeyboardFrame): void {
    emitKeyboardEvent("keyboardDidShow", frame);
  }

  const ROOM_ABOVE_KEYBOARD = KEYBOARD_TOP - VIEW_TOP;
  const HALF_COVERED = KEYBOARD_TOP - INPUT_HEIGHT / 2;
  const CLEAR_ABOVE = KEYBOARD_TOP - INPUT_HEIGHT - spacing.lg;
  const SCROLLED_BY = 200;

  describe.each([
    { os: "ios", frame: keyboardFrame(KEYBOARD_TOP, true), viewBottom: WINDOW_HEIGHT },
    { os: "android", frame: androidKeyboardFrame(KEYBOARD_TOP), viewBottom: KEYBOARD_TOP },
  ] as const)("on $os", ({ os, frame, viewBottom }) => {
    let original: typeof Platform.OS;

    beforeEach(() => {
      original = Platform.OS;
      Platform.OS = os;
      viewportTo(viewBottom);
    });

    afterEach(() => {
      Platform.OS = original;
    });

    test("scrolls on by just the part of the focused input the keyboard covers", () => {
      focusOn(inputOnPageAt(HALF_COVERED, 0));
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).toHaveBeenCalledWith({
        x: 0,
        y: INPUT_HEIGHT / 2 + spacing.md,
        animated: true,
      });
    });

    test("scrolls on from where the page already is", () => {
      focusOn(inputOnPageAt(HALF_COVERED, SCROLLED_BY));
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).toHaveBeenCalledWith({
        x: 0,
        y: SCROLLED_BY + INPUT_HEIGHT / 2 + spacing.md,
        animated: true,
      });
    });

    test("leaves the offset alone for an input that already sits above the keyboard", () => {
      focusOn(inputOnPageAt(CLEAR_ABOVE, 0));
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).not.toHaveBeenCalled();
    });

    // A field taller than the room above the keyboard cannot show its bottom without losing its
    // top, where an empty field's caret is; it is never pushed past its own top.
    test("keeps the top of a field taller than the room above the keyboard", () => {
      const tall = ROOM_ABOVE_KEYBOARD + spacing.xl;
      focusOn(inputOnPageAt(VIEW_TOP + spacing.lg, 0, tall));
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: spacing.lg - spacing.md, animated: true });
    });

    test("stays put for the empty frame the photo picker reports, which covers nothing", () => {
      focusOn(inputOnPageAt(HALF_COVERED, 0));
      renderScaffold();

      showKeyboard(emptyKeyboardFrame());

      expect(scrollTo).not.toHaveBeenCalled();
    });

    test("stays put when the keyboard comes up with no input focused", () => {
      focusOn(null);
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).not.toHaveBeenCalled();
    });

    // Two screens are mounted at once during a transition, and both are told about the keyboard;
    // an input outside this scroll view reports no layout within its content.
    test("stays put for a focused input that is not on this page", () => {
      focusOn({
        measure: (onSuccess) => onSuccess(0, 0, 300, INPUT_HEIGHT, 0, KEYBOARD_TOP),
        measureLayout: jest.fn(),
      });
      renderScaffold();

      showKeyboard(frame);

      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  // Android pads for the keyboard in the same event that reveals the input, so the scroll asked
  // for then is clamped to the content's old range; the content growing is when it can finish.
  describe("and the padding on Android", () => {
    let original: typeof Platform.OS;

    beforeEach(() => {
      original = Platform.OS;
      Platform.OS = "android";
      viewportTo(WINDOW_HEIGHT);
      focusOn(inputOnPageAt(HALF_COVERED, 0));
      renderScaffold();
    });

    afterEach(() => {
      Platform.OS = original;
    });

    function growContent(): void {
      fireEvent(screen.getByTestId("scaffold"), "contentSizeChange", WINDOW_WIDTH, WINDOW_HEIGHT);
    }

    test("scrolls again once the content has grown for the keyboard", () => {
      showKeyboard(androidKeyboardFrame(KEYBOARD_TOP));
      scrollTo.mockClear();

      growContent();

      expect(scrollTo).toHaveBeenCalledWith({
        x: 0,
        y: INPUT_HEIGHT / 2 + spacing.md,
        animated: true,
      });
    });

    test("scrolls once only for content that grows for another reason", () => {
      showKeyboard(androidKeyboardFrame(KEYBOARD_TOP));
      growContent();
      scrollTo.mockClear();

      growContent();

      expect(scrollTo).not.toHaveBeenCalled();
    });

    test("forgets the reveal once the keyboard has gone", () => {
      showKeyboard(androidKeyboardFrame(KEYBOARD_TOP));
      scrollTo.mockClear();

      emitKeyboardEvent("keyboardDidHide", androidKeyboardFrame(WINDOW_HEIGHT));
      growContent();

      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  // iOS pads before the keyboard is up, so the content is already its full size when the reveal
  // runs.
  test("scrolls once on iOS, whatever the content does afterwards", () => {
    viewportTo(WINDOW_HEIGHT);
    focusOn(inputOnPageAt(HALF_COVERED, 0));
    renderScaffold();
    showKeyboard(keyboardFrame(KEYBOARD_TOP, true));
    scrollTo.mockClear();

    fireEvent(screen.getByTestId("scaffold"), "contentSizeChange", WINDOW_WIDTH, WINDOW_HEIGHT);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("stays put for a keyboard that belongs to another app", () => {
    viewportTo(WINDOW_HEIGHT);
    focusOn(inputOnPageAt(HALF_COVERED, 0));
    renderScaffold();

    showKeyboard(keyboardFrame(KEYBOARD_TOP, false));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  // Both measurements come from the scroll view itself; before it has mounted its content there is
  // nothing to place the input against.
  test("stays put while the scroll view has no content view to measure against", () => {
    getInnerViewRef.mockReturnValue(undefined);
    viewportTo(WINDOW_HEIGHT);
    focusOn(inputOnPageAt(HALF_COVERED, 0));
    renderScaffold();

    showKeyboard(keyboardFrame(KEYBOARD_TOP, true));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("stays put while the scroll view has no viewport to measure", () => {
    focusOn(inputOnPageAt(HALF_COVERED, 0));
    renderScaffold();

    showKeyboard(keyboardFrame(KEYBOARD_TOP, true));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
