import { useRef, type RefObject } from "react";
import type { Focusable } from "@/lib/announce";

// Fabric mounts a view one step behind the commit that created it, so a focus requested from that
// commit names a view iOS does not hold yet. A view's first layout is the earliest moment it does.
export function useFocusOnLayout(
  target: RefObject<Focusable | null>,
  focus: (node: Focusable | null) => void,
): () => void {
  const focused = useRef<Focusable | null>(null);

  // A card that comes back after a failed retry is a new view and is spoken again; the same view
  // laid out again, at a new text size say, is not.
  return () => {
    if (target.current === focused.current) return;
    focused.current = target.current;
    focus(target.current);
  };
}
