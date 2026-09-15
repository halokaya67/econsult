import { useCallback, useLayoutEffect, useRef } from "react";
import type { IsRelayout } from "./ScreenScaffold";

// A layout effect runs after the children's, before anything they announce, and again on the next
// commit: the flag is on for the mount the new scale forced and off as soon as the page moves on.
export function useRelayoutFlag(fontScale: number): IsRelayout {
  const isRelayout = useRef(false);
  const lastFontScale = useRef(fontScale);

  useLayoutEffect(() => {
    isRelayout.current = lastFontScale.current !== fontScale;
    lastFontScale.current = fontScale;
  });

  return useCallback(() => isRelayout.current, []);
}
