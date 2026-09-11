import { render, screen, userEvent } from "@testing-library/react-native";
import { TextField } from "./TextField";

describe("TextField", () => {
  test("shows the label with its requirement and uses it as the accessible name", () => {
    render(
      <TextField
        label="Are you taking anything?"
        requirement="optional"
        value=""
        onChangeText={() => {}}
      />,
    );

    expect(screen.getByText("Are you taking anything? (optional)")).toBeOnTheScreen();
    expect(screen.getByLabelText("Are you taking anything? (optional)")).toBeOnTheScreen();
  });

  test("passes typed text to onChangeText and exposes the hint", async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    render(
      <TextField
        label="Your message"
        hint="Where, since when"
        value=""
        onChangeText={onChangeText}
        multiline
      />,
    );

    const input = screen.getByLabelText("Your message");
    await user.type(input, "Hi");

    expect(onChangeText).toHaveBeenCalled();
    expect(input.props.accessibilityHint).toBe("Where, since when");
    expect(screen.getByText("Where, since when")).toBeOnTheScreen();
  });

  test("folds an error into the accessible name and shows it in a live region", () => {
    render(
      <TextField
        label="Your message"
        value=""
        onChangeText={() => {}}
        error="Please write your question"
      />,
    );

    expect(
      screen.getByLabelText("Your message. Error: Please write your question"),
    ).toBeOnTheScreen();
    const error = screen.getByText("Please write your question");
    expect(error.props.accessibilityLiveRegion).toBe("polite");
  });

  test("becomes read-only when editable is false", () => {
    render(<TextField label="Your message" value="Hi" onChangeText={() => {}} editable={false} />);

    expect(screen.getByLabelText("Your message").props.editable).toBe(false);
  });
});
