import { useEffect, useRef, type RefObject } from "react";
import { Keyboard, Platform, TextInput, type ScrollView } from "react-native";
import type { Focusable } from "@/lib/announce";
import { spacing } from "@/theme/tokens";
import { contentViewOf } from "./scrollToField";
import { isCoveringFrame, isForeignKeyboard } from "./useKeyboardInset";

type Edges = { top: number; bottom: number };

type Reveal = { input: Focusable; keyboardTop: number };

// Page coordinates, not measureInWindow: Android's window origin sits below the status bar while
// the keyboard's screenY is a screen coordinate, and the root view is the screen on both platforms.
function measureEdges(node: Pick<Focusable, "measure">, onDone: (edges: Edges) => void): void {
  node.measure((_x, _y, _width, height, _pageX, pageY) =>
    onDone({ top: pageY, bottom: pageY + height }),
  );
}

// Scrolls on by just what the keyboard covers, so the label above the field stays put, and never
// past the field's own top. The visible edge is the keyboard's top, or the scroll view's own
// bottom where that is higher.
function revealInput(scroll: ScrollView, input: Focusable, keyboardTop: number): void {
  const content = contentViewOf(scroll);
  const viewport = scroll.getNativeScrollRef();
  if (content == null || viewport == null) return;
  // Placed from the content rather than a tracked offset: Android scrolls the caret line in
  // natively before any scroll event reaches JavaScript.
  input.measureLayout(content, (_left, contentTop, _width, inputHeight) =>
    measureEdges(viewport, (view) =>
      measureEdges(input, (field) => {
        const visibleBottom = Math.min(keyboardTop, view.bottom);
        if (field.bottom <= visibleBottom) return;
        const bottomAligned = contentTop + inputHeight + spacing.md - (visibleBottom - view.top);
        const topAligned = contentTop - spacing.md;
        const y = Math.max(0, Math.min(bottomAligned, topAligned));
        scroll.scrollTo({ x: 0, y, animated: true });
      }),
    ),
  );
}

// Answered once the keyboard is up: on iOS the frame that starts it arrives before the input's own
// focus event, on Android the keyboard is only reported once shown.
export function useRevealFocusedInput(scroll: RefObject<ScrollView | null>): () => void {
  // Android pads for the keyboard in the same event, so the scroll asked for here is clamped to
  // the content's old range; it is asked for again once the content has grown.
  const pending = useRef<Reveal | null>(null);

  useEffect(() => {
    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", (event) => {
        const view = scroll.current;
        const input: Focusable | null = TextInput.State.currentlyFocusedInput();
        if (isForeignKeyboard(event) || !isCoveringFrame(event.endCoordinates)) return;
        if (view === null || input == null) return;
        const keyboardTop = event.endCoordinates.screenY;
        pending.current = Platform.OS === "android" ? { input, keyboardTop } : null;
        revealInput(view, input, keyboardTop);
      }),
      Keyboard.addListener("keyboardDidHide", () => {
        pending.current = null;
      }),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [scroll]);

  return () => {
    const view = scroll.current;
    const reveal = pending.current;
    pending.current = null;
    if (view !== null && reveal !== null) revealInput(view, reveal.input, reveal.keyboardTop);
  };
}
