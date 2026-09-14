import { fireEvent, screen } from "@testing-library/react-native";
import { useRef } from "react";
import { ScrollView, Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { renderWithProviders } from "@/test/providers";
import { spacing } from "@/theme/tokens";
import { useScrollToField } from "./useScrollToField";

// The jest ScrollView and Text mocks expose every native method as a shared jest.fn, so the real
// measure-then-scroll path can be driven end to end.
const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
const getInnerViewNode = jest.mocked(ScrollView.prototype.getInnerViewNode);
// getInnerViewRef is mocked by the jest preset but missing from ScrollView's types.
const getInnerViewRef = jest.mocked(
  (ScrollView.prototype as ScrollView & { getInnerViewRef: () => unknown }).getInnerViewRef,
);
const measureLayout = jest.mocked(Text.prototype.measureLayout);

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
const FIELD_TOP = 480;

function FieldProbe({ withNode = true }: { withNode?: boolean }) {
  const scrollToField = useScrollToField();
  const fieldRef = useRef<Text>(null);
  return (
    <Text ref={fieldRef} onPress={() => scrollToField(withNode ? fieldRef.current : null)}>
      Field
    </Text>
  );
}

describe("useScrollToField", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewNode.mockReset();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
  });

  test("scrolls a field into view with a margin above it", () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, FIELD_TOP, 300, 40));
    renderWithProviders(
      <ScreenScaffold>
        <FieldProbe />
      </ScreenScaffold>,
    );

    fireEvent.press(screen.getByText("Field"));

    expect(measureLayout).toHaveBeenCalledWith(CONTENT_REF, expect.any(Function));
    // A node handle is silently ignored by measureLayout under the New Architecture.
    expect(getInnerViewNode).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({
      x: 0,
      y: FIELD_TOP - spacing.md,
      animated: true,
    });
  });

  test("stays put when the field it is asked to scroll to is not mounted", () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    renderWithProviders(
      <ScreenScaffold>
        <FieldProbe withNode={false} />
      </ScreenScaffold>,
    );

    fireEvent.press(screen.getByText("Field"));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("does nothing when it is called outside a scaffold", () => {
    renderWithProviders(<FieldProbe />);

    fireEvent.press(screen.getByText("Field"));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
