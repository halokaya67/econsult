import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

describe("PrimaryButton", () => {
  test("has a button role, its label as name, and a 48 point minimum size", () => {
    render(<PrimaryButton label="Send" onPress={() => {}} />);

    const button = screen.getByRole("button", { name: "Send" });

    expect(button).toHaveStyle({ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH });
  });

  test("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<PrimaryButton label="Send" onPress={onPress} />);

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("is disabled with a spoken reason and does not fire", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(
      <PrimaryButton
        label="Send"
        onPress={onPress}
        disabled
        accessibilityHint="Choose a recipient first"
      />,
    );

    const button = screen.getByRole("button", { name: "Send", disabled: true });
    await user.press(button);

    expect(button.props.accessibilityHint).toBe("Choose a recipient first");
    expect(onPress).not.toHaveBeenCalled();
  });

  test("announces the busy label while busy and blocks presses", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<PrimaryButton label="Send" busyLabel="Sending" busy onPress={onPress} />);

    const button = screen.getByRole("button", { name: "Sending", busy: true });
    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
