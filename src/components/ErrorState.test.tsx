import { render, screen, userEvent } from "@testing-library/react-native";
import { RETRY_LABEL } from "@/lib/retryLabel";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  test("blocks its retry with a spoken reason when one is given", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    const reason = "You're offline. Sending needs a connection.";
    render(
      <ErrorState
        title="Your message wasn't sent"
        body="Check your connection"
        onRetry={onRetry}
        retryBlockedReason={reason}
      />,
    );

    const retry = screen.getByRole("button", { name: RETRY_LABEL, disabled: true });
    await user.press(retry);

    expect(retry.props.accessibilityHint).toBe(reason);
    expect(onRetry).not.toHaveBeenCalled();
  });

  // A grouped element speaks its children's text but discards their roles, so a header inside the
  // alert would be a name no rotor can reach.
  test("reads as one alert and leaves no unreachable header behind", () => {
    render(<ErrorState title="We couldn't load" body="Check your connection" onRetry={() => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't loadCheck your connection");
    expect(screen.queryByRole("header")).toBeNull();
  });

  test("is an alert with a retry button", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorState title="We couldn't load" body="Check your connection" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load", { exact: false });
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
