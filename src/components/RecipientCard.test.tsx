import { render, screen, userEvent } from "@testing-library/react-native";
import { borderWidth } from "@/theme/tokens";
import { RecipientCard } from "./RecipientCard";

describe("RecipientCard", () => {
  test("is a radio named after the person and their role, at least 64 points tall", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<RecipientCard name="Dr. J. de Vries" role="GP" checked={false} onPress={onPress} />);

    const card = screen.getByRole("radio", { name: "Dr. J. de Vries, GP", checked: false });
    await user.press(card);

    expect(card).toHaveStyle({ minHeight: 64, borderWidth });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("reports its checked state", () => {
    render(<RecipientCard name="M. Bakker" role="Practice nurse" checked onPress={() => {}} />);

    expect(
      screen.getByRole("radio", { name: "M. Bakker, Practice nurse", checked: true }),
    ).toBeOnTheScreen();
  });
});
