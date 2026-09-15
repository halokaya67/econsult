import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRef } from "react";
import { AccessibilityInfo, Dimensions, Text, useWindowDimensions, View } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { focusForScreenReader, type Focusable } from "@/lib/announce";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useFocusOnLayout } from "./useFocusOnLayout";

// Jest renders no layout, so the text-size hook is the only place a live Dynamic Type change can be
// simulated; every other test keeps the real window metrics.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => {
  const { Dimensions: realDimensions } = jest.requireActual("react-native");
  return { __esModule: true, default: jest.fn(() => realDimensions.get("window")) };
});

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

function setFontScale(fontScale: number): void {
  jest.mocked(useWindowDimensions).mockReturnValue({ ...Dimensions.get("window"), fontScale });
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

  // A text-size change remounts the whole page, so the card is a new view although the patient has
  // been looking at it all along and has already heard it.
  test("leaves a card the text size laid out again unspoken", () => {
    const focus = spyOnFocus();
    setFontScale(1);
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <Step hasCard />
      </ScreenScaffold>,
    );
    layOutCard();
    const cardBefore = screen.getByRole("alert");

    setFontScale(2);
    rerender(
      <ScreenScaffold>
        <Step hasCard />
      </ScreenScaffold>,
    );
    layOutCard();

    expect(screen.getByRole("alert")).not.toBe(cardBefore);
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
