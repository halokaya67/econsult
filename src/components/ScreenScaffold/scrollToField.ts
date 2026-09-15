import type { ScrollView } from "react-native";
import type { Focusable } from "@/lib/announce";
import { spacing } from "@/theme/tokens";

// getInnerViewRef returns the content view element; it is absent from ScrollView's types.
type WithInnerViewRef = { getInnerViewRef?: () => Focusable | null };

// The New Architecture measures only against an element ref, so the node handle from
// getInnerViewNode is silently ignored.
export function contentViewOf(scroll: ScrollView): Focusable | null {
  return (scroll as ScrollView & WithInnerViewRef).getInnerViewRef?.() ?? null;
}

// Children sit in the scroll view's content view, so their offset within it is the offset to
// scroll to; the margin keeps the field clear of the top edge.
export function scrollFieldIntoView(scroll: ScrollView, node: Focusable): void {
  const content = contentViewOf(scroll);
  if (content == null) return;
  node.measureLayout(content, (_left, top) =>
    scroll.scrollTo({ x: 0, y: Math.max(0, top - spacing.md), animated: true }),
  );
}
