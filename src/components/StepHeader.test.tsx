import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { StepHeader } from "./StepHeader";

describe("StepHeader", () => {
  test("shows the step counter and a heading, and announces both on mount", () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});

    render(<StepHeader stepNumber={2} stepCount={3} title="A few questions from your practice" />);

    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "A few questions from your practice" }),
    ).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith("Step 2 of 3: A few questions from your practice");
  });
});
