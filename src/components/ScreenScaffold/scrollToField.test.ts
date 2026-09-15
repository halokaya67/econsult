import type { ScrollView } from "react-native";
import type { Focusable } from "@/lib/announce";
import { spacing } from "@/theme/tokens";
import { scrollFieldIntoView } from "./scrollToField";

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};

// The scroll view as the helper sees it: what it answers for its content view, and the scroll it
// is asked for.
function scrollViewWith(contentView: object | undefined) {
  const scrollTo = jest.fn();
  const scroll = { getInnerViewRef: () => contentView, scrollTo } as unknown as ScrollView;
  return { scroll, scrollTo };
}

function fieldAt(top: number): Focusable {
  const field: Pick<Focusable, "measureLayout"> = {
    measureLayout: (_relativeTo, onSuccess) => onSuccess(0, top, 300, 40),
  };
  return field as Focusable;
}

describe("scrollFieldIntoView", () => {
  test("never scrolls above the top for a field inside the margin", () => {
    const { scroll, scrollTo } = scrollViewWith(CONTENT_REF);

    scrollFieldIntoView(scroll, fieldAt(spacing.sm));

    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 0, animated: true });
  });

  test("stays put while the scroll view has no content view to measure against", () => {
    const { scroll, scrollTo } = scrollViewWith(undefined);

    scrollFieldIntoView(scroll, fieldAt(spacing.xl));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
