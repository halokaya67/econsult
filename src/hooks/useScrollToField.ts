import { createContext, useContext } from "react";
import type { Focusable } from "@/lib/announce";

export type ScrollToField = (node: Focusable | null) => void;

// ScreenScaffold owns the scroll view and provides the real implementation; outside one the
// default no-op keeps the call site unconditional.
export const ScrollToFieldContext = createContext<ScrollToField>(() => {});

// Large text can push a validation error far above the viewport, where moving screen-reader focus
// to it leaves the screen looking untouched. Only components rendered inside the scaffold reach
// its scroll view, so a screen reads this from its action rather than from itself.
export function useScrollToField(): ScrollToField {
  return useContext(ScrollToFieldContext);
}
