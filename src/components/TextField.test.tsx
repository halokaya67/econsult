import { render, screen, userEvent } from "@testing-library/react-native";
import { Dimensions, TextInput, View } from "react-native";
import { MULTILINE_MIN_HEIGHT, TextField } from "./TextField";

// A window at the largest accessibility text size; useWindowDimensions reads it from Dimensions.
const LARGE_TEXT_WINDOW = { width: 393, height: 852, scale: 3, fontScale: 3 };

describe("TextField", () => {
  afterEach(() => jest.restoreAllMocks());

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

  test("hands the wrapping view to containerRef and the input to ref", () => {
    let container: unknown = null;
    let input: unknown = null;

    render(
      <TextField
        label="Your message"
        value=""
        onChangeText={() => {}}
        containerRef={(node) => void (container = node)}
        ref={(node) => void (input = node)}
      />,
    );

    expect(container).toBeInstanceOf(View);
    expect(input).toBeInstanceOf(TextInput);
  });

  test("scales the multiline minimum height with the system font scale", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue(LARGE_TEXT_WINDOW);

    render(<TextField label="Your message" value="" onChangeText={() => {}} multiline />);

    expect(screen.getByLabelText("Your message")).toHaveStyle({
      minHeight: MULTILINE_MIN_HEIGHT * LARGE_TEXT_WINDOW.fontScale,
    });
  });
});
