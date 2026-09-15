import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { ApiError } from "@/api/transport";
import { OFFLINE_HINT, RETRY_LABEL } from "@/lib/copy";
import { ERROR_TITLE, SendFeedback } from "./SendFeedback";

const SENDING_STATUS = "Sending your message";
const NETWORK_COPY = "We couldn't reach your practice. Check your connection and try again.";
const networkError = new ApiError("network", "fetch failed");

// Stands in for the layout pass that follows the native mount; nothing lays out in a test renderer.
function layOut(node: ReturnType<typeof screen.getByRole>) {
  fireEvent(node, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } } });
}

function renderFeedback({ status = "", error = null as Error | null, isOffline = false } = {}) {
  const onSend = jest.fn(async () => {});
  render(<SendFeedback status={status} error={error} isOffline={isOffline} onSend={onSend} />);
  return onSend;
}

describe("SendFeedback", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows the status as plain copy, with no live region", () => {
    renderFeedback({ status: SENDING_STATUS });

    const status = screen.getByText(SENDING_STATUS);

    expect(status).toBeOnTheScreen();
    expect(status.props.accessibilityLiveRegion).toBeUndefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows nothing while there is no status and no error", () => {
    renderFeedback();

    expect(screen.toJSON()).toBeNull();
  });

  test("a failed send shows the card with a plain-language reason, and Retry sends again", async () => {
    const user = userEvent.setup();
    const onSend = renderFeedback({ error: networkError });

    expect(
      screen.getByRole("alert", { name: `${ERROR_TITLE}. ${NETWORK_COPY}` }),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(expect.any(Function));
  });

  // Fabric holds no view for the card in the commit that inserted it, so the focus that speaks it
  // waits for the card's first layout.
  test("the card is focused once it is laid out, not before", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    renderFeedback({ error: networkError });
    const card = screen.getByRole("alert");

    expect(focus).not.toHaveBeenCalled();
    layOut(card);

    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(expect.objectContaining({ props: card.props }), "focus");
  });

  test("Retry is blocked with the offline reason while offline", () => {
    renderFeedback({ error: networkError, isOffline: true });

    const retry = screen.getByRole("button", { name: RETRY_LABEL, disabled: true });

    expect(retry.props.accessibilityHint).toBe(OFFLINE_HINT);
  });
});
