import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRef } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { focusForScreenReader, type Focusable } from "@/lib/announce";
import { useFocusOnLayout } from "./useFocusOnLayout";

const CARD_NAME = "We couldn't load your practice's details. Check your connection and try again.";
const LAYOUT = { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 120 } } };

// The name the focused node carried at the moment focus was sent, which is what VoiceOver reads.
function nameWhenFocused(node: unknown): string | undefined {
  return (node as { props?: { accessibilityLabel?: string } }).props?.accessibilityLabel;
}

// Stands in for a step whose error card comes and goes while the step itself stays up, so the
// hook outlives the view it focuses.
function Step({ hasCard }: { hasCard: boolean }) {
  const card = useRef<Focusable | null>(null);
  const onLayout = useFocusOnLayout(card, focusForScreenReader);

  if (!hasCard) return <Text>Loading</Text>;
  return (
    <View
      ref={(node) => {
        card.current = node;
      }}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={CARD_NAME}
      onLayout={onLayout}
    />
  );
}

function layOutCard() {
  fireEvent(screen.getByRole("alert"), "layout", LAYOUT);
}

function spyOnFocus() {
  const focus = jest
    .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
    .mockImplementation(() => {});
  // The preset already mocks it, so the spy is the mock every earlier test wrote to.
  focus.mockClear();
  return focus;
}

describe("useFocusOnLayout", () => {
  afterEach(() => jest.restoreAllMocks());

  test("asks for nothing while the view has not been laid out", () => {
    const focus = spyOnFocus();

    render(<Step hasCard />);

    expect(focus).not.toHaveBeenCalled();
  });

  test("focuses the view at its first layout", () => {
    const focus = spyOnFocus();
    render(<Step hasCard />);

    layOutCard();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(nameWhenFocused(focus.mock.calls[0][0])).toBe(CARD_NAME);
  });

  test("focuses once however often the same view is laid out again", () => {
    const focus = spyOnFocus();
    render(<Step hasCard />);

    layOutCard();
    layOutCard();
    layOutCard();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  test("focuses the next view too, so a card that comes back after a retry is spoken again", () => {
    const focus = spyOnFocus();
    const view = render(<Step hasCard />);
    layOutCard();

    view.rerender(<Step hasCard={false} />);
    view.rerender(<Step hasCard />);
    layOutCard();

    expect(focus).toHaveBeenCalledTimes(2);
  });
});
