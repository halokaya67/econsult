import { useRef, type RefObject } from "react";
import { useIsRelayout } from "@/components/ScreenScaffold/ScreenScaffold";
import type { Focusable } from "@/lib/announce";

// Fabric mounts a view one step behind the commit that created it, so a focus requested from that
// commit names a view iOS does not hold yet. A view's first layout is the earliest moment it does.
export function useFocusOnLayout(
  target: RefObject<Focusable | null>,
  focus: (node: Focusable | null) => void,
): () => void {
  const focused = useRef<Focusable | null>(null);
  const isRelayout = useIsRelayout();

  // A card that comes back after a failed retry is a new view and is spoken again. A text-size
  // change makes a new view of the card the patient is already looking at, which is not.
  return () => {
    if (target.current === focused.current) return;
    focused.current = target.current;
    if (isRelayout()) return;
    focus(target.current);
  };
}
