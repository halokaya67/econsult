import { render, screen, userEvent } from "@testing-library/react-native";
import { CHANGE_HINT, ToRow } from "./ToRow";

const NAME = "Dr. J. de Vries";

describe("ToRow", () => {
  test("names who the message goes to and lets the patient change them", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ToRow name={NAME} disabled={false} onChange={onChange} />);

    expect(screen.getByText(`To: ${NAME}`)).toBeOnTheScreen();
    const change = screen.getByRole("button", { name: "Change", disabled: false });
    expect(change.props.accessibilityHint).toBe(CHANGE_HINT);
    await user.press(change);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("keeps Change disabled while the send is in flight", () => {
    render(<ToRow name={NAME} disabled onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Change", disabled: true })).toBeOnTheScreen();
  });
});
