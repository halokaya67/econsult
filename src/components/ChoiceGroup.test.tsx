import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { ChoiceGroup } from "./ChoiceGroup";

const OPTIONS = ["Less than a week", "1 to 4 weeks"];

describe("ChoiceGroup", () => {
  test("is a labelled group whose options are radios with a checked state", () => {
    render(
      <ChoiceGroup
        label="How long?"
        requirement="required"
        options={OPTIONS}
        value="1 to 4 weeks"
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("How long? (required)")).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "1 to 4 weeks", checked: true })).toHaveStyle({
      minHeight: MIN_TOUCH,
    });
    expect(
      screen.getByRole("radio", { name: "Less than a week", checked: false }),
    ).toBeOnTheScreen();
  });

  test("selecting an option calls onChange with it", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ChoiceGroup label="How long?" options={OPTIONS} value={null} onChange={onChange} />);

    await user.press(screen.getByRole("radio", { name: "Less than a week" }));

    expect(onChange).toHaveBeenCalledWith("Less than a week");
  });

  test("folds an error into the group's name and shows it in a live region", () => {
    render(
      <ChoiceGroup
        label="How long?"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        error="This question is required"
      />,
    );

    expect(screen.getByLabelText("How long?. Error: This question is required")).toBeOnTheScreen();
    expect(screen.getByText("This question is required").props.accessibilityLiveRegion).toBe(
      "polite",
    );
  });
});
