import { render, screen, userEvent } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { RETRY_LABEL } from "@/lib/retryLabel";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  afterEach(() => jest.restoreAllMocks());

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
  test("reads as one alert with a retry button and leaves no unreachable header behind", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorState title="We couldn't load" body="Check your connection" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't loadCheck your connection");
    expect(screen.queryByRole("header")).toBeNull();
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // VoiceOver never hears a live region, so the announcement is the alert's only spoken channel;
  // keeping the region would have TalkBack say it twice.
  test("speaks its title and body once, and not from a live region", () => {
    const spoken = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    spoken.mockClear();

    render(
      <ErrorState title="We couldn't load" body="Check your connection." onRetry={() => {}} />,
    );

    expect(spoken).toHaveBeenCalledTimes(1);
    expect(spoken).toHaveBeenCalledWith("We couldn't load. Check your connection.");
    expect(screen.getByRole("alert").props.accessibilityLiveRegion).toBeUndefined();
  });
});
