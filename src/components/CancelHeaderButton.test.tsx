import { render, screen, userEvent } from "@testing-library/react-native";
import { HEADER_BUTTON_MAX_FONT_SCALE } from "@/theme/tokens";
import { CancelHeaderButton } from "./CancelHeaderButton";

describe("CancelHeaderButton", () => {
  test("is a button named Cancel whose label caps its text for the native bar", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<CancelHeaderButton onPress={onPress} />);

    await user.press(screen.getByRole("button", { name: "Cancel" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Cancel")).toHaveProp(
      "maxFontSizeMultiplier",
      HEADER_BUTTON_MAX_FONT_SCALE,
    );
  });
});
