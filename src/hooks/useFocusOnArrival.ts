import { useEffect, useRef, type RefObject } from "react";
import { focusForScreenReader, type Focusable } from "@/lib/announce";

// The slice of a navigation object this listens on: the native stack reports transitionEnd when a
// screen has finished appearing.
export type ArrivalNavigation = {
  addListener: (type: "transitionEnd", listener: () => void) => () => void;
};

// Long enough to outlast a push animation, so a reported transition always wins the race.
const FALLBACK_DELAY_MS = 600;

// VoiceOver drops a focus event sent while the push transition is still running, which left the
// confirmation silent. A screen that arrives without a reported transition is focused anyway.
export function useFocusOnArrival(
  navigation: ArrivalNavigation,
  target: RefObject<Focusable | null>,
): void {
  const hasFocused = useRef(false);

  useEffect(() => {
    const focusOnce = () => {
      if (hasFocused.current) return;
      hasFocused.current = true;
      focusForScreenReader(target.current);
    };
    const unsubscribe = navigation.addListener("transitionEnd", focusOnce);
    const fallback = setTimeout(focusOnce, FALLBACK_DELAY_MS);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation, target]);
}
