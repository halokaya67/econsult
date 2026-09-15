import { render, screen, userEvent } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { RETRY_LABEL } from "@/lib/copy";
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

  // Whoever shows the card moves screen-reader focus to it, which speaks its name; announcing here
  // as well is what had VoiceOver say the sentence twice.
  test("says nothing of its own, and is not a live region", () => {
    const spoken = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    spoken.mockClear();

    render(
      <ErrorState title="We couldn't load" body="Check your connection." onRetry={() => {}} />,
    );

    expect(spoken).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").props.accessibilityLiveRegion).toBeUndefined();
  });

  // Left to iOS, a grouped view's name is its children joined with commas, which speaks the title
  // and the body as one run-on sentence.
  test("is named by its title and body joined with a sentence break", () => {
    const name = "Your message wasn't sent. We couldn't reach your practice.";

    render(
      <ErrorState
        title="Your message wasn't sent"
        body="We couldn't reach your practice."
        onRetry={() => {}}
      />,
    );

    expect(screen.getByRole("alert", { name })).toBeOnTheScreen();
  });

  test("keeps one period when the title already ends with one", () => {
    render(
      <ErrorState title="We couldn't load." body="Check your connection." onRetry={() => {}} />,
    );

    expect(
      screen.getByRole("alert", { name: "We couldn't load. Check your connection." }),
    ).toBeOnTheScreen();
  });
});
