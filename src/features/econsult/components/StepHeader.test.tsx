import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Dimensions, useWindowDimensions } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { renderWithProviders } from "@/test/renderWithProviders";
import { StepHeader } from "./StepHeader";

// Jest renders no layout, so the text-size hook is the only place a live Dynamic Type change can be
// simulated; every other test keeps the real window metrics.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => {
  const { Dimensions: realDimensions } = jest.requireActual("react-native");
  return { __esModule: true, default: jest.fn(() => realDimensions.get("window")) };
});

const TITLE = "A few questions from your practice";

function spyOnAnnounce() {
  const spoken = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {});
  // The preset already mocks it, so the spy is the mock every earlier test wrote to.
  spoken.mockClear();
  return spoken;
}

function stepsSpoken(spoken: ReturnType<typeof spyOnAnnounce>): string[] {
  return spoken.mock.calls.map(([line]) => line).filter((line) => line.startsWith("Step"));
}

function setFontScale(fontScale: number): void {
  jest.mocked(useWindowDimensions).mockReturnValue({ ...Dimensions.get("window"), fontScale });
}

describe("StepHeader", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows the step counter and a heading, and announces both on mount", () => {
    const spoken = spyOnAnnounce();

    render(<StepHeader stepNumber={2} stepCount={3} title={TITLE} />);

    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: TITLE })).toBeOnTheScreen();
    expect(stepsSpoken(spoken)).toEqual([`Step 2 of 3: ${TITLE}`]);
  });

  // The scaffold remounts the page on a text-size change, so the header mounts a second time
  // without the patient having gone anywhere.
  test("says nothing when a text-size change has only laid the step out again", () => {
    const spoken = spyOnAnnounce();
    setFontScale(1);
    const { rerender } = renderWithProviders(
      <ScreenScaffold>
        <StepHeader stepNumber={2} stepCount={3} title={TITLE} />
      </ScreenScaffold>,
    );
    expect(stepsSpoken(spoken)).toHaveLength(1);

    setFontScale(2);
    rerender(
      <ScreenScaffold>
        <StepHeader stepNumber={2} stepCount={3} title={TITLE} />
      </ScreenScaffold>,
    );

    expect(screen.getByRole("header", { name: TITLE })).toBeOnTheScreen();
    expect(stepsSpoken(spoken)).toHaveLength(1);
  });
});
