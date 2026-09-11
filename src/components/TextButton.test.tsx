import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { TextButton } from "./TextButton";

describe("TextButton", () => {
  test("is a button with its label as name and a 48 point minimum height", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<TextButton label="Change" onPress={onPress} />);

    const button = screen.getByRole("button", { name: "Change" });
    await user.press(button);

    expect(button).toHaveStyle({ minHeight: MIN_TOUCH });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("can be disabled and then ignores presses", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<TextButton label="Change" onPress={onPress} disabled />);

    await user.press(screen.getByRole("button", { name: "Change", disabled: true }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
