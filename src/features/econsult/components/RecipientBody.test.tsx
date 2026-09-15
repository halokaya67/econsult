import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { RETRY_LABEL } from "@/lib/copy";
import {
  EMPTY_BODY,
  EMPTY_TITLE,
  ERROR_BODY,
  ERROR_TITLE,
  LOADING_LABEL,
  RecipientBody,
} from "./RecipientBody";
import type { RecipientsResult } from "../utils/recipients";
import { STEP_TITLES } from "../utils/steps";

const READY: RecipientsResult = {
  status: "ready",
  questions: [],
  recipients: [
    { id: "ct-01", displayName: "Dr. J. de Vries", role: "gp" },
    { id: "ct-02", displayName: "M. Bakker", role: "nurse" },
  ],
};

// Stands in for the layout pass that follows the native mount; nothing lays out in a test renderer.
function layOut(node: ReturnType<typeof screen.getByRole>) {
  fireEvent(node, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 120 } } });
}

function renderBody(result: RecipientsResult, selectedId: string | null = null) {
  const onSelect = jest.fn();
  const goHome = jest.fn();
  render(
    <RecipientBody result={result} selectedId={selectedId} onSelect={onSelect} goHome={goHome} />,
  );
  return { onSelect, goHome };
}

describe("RecipientBody", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows the loading skeleton named after what is loading", () => {
    renderBody({ status: "loading" });

    expect(screen.getByRole("progressbar", { name: LOADING_LABEL })).toBeOnTheScreen();
    expect(screen.queryByLabelText(STEP_TITLES.recipient)).toBeNull();
  });

  test("shows the empty state, and Back to start goes home", async () => {
    const user = userEvent.setup();
    const { goHome } = renderBody({ status: "empty" });

    expect(screen.getByRole("header", { name: EMPTY_TITLE })).toBeOnTheScreen();
    expect(screen.getByText(EMPTY_BODY)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Back to start" }));

    expect(goHome).toHaveBeenCalledTimes(1);
  });

  test("a failed load shows the error card, and Try again retries the load", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    renderBody({ status: "error", retry });

    expect(screen.getByRole("alert", { name: `${ERROR_TITLE}. ${ERROR_BODY}` })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  // Fabric holds no view for the card in the commit that inserted it, so the focus that speaks it
  // waits for the card's first layout.
  test("the error card is spoken by focusing it once it is laid out, not before", () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    renderBody({ status: "error", retry: () => {} });
    const card = screen.getByRole("alert");

    expect(focus).not.toHaveBeenCalled();
    layOut(card);

    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(expect.objectContaining({ props: card.props }), "focus");
  });

  test("lists the recipients as radios in a group named after the step, with the chosen one checked", () => {
    renderBody(READY, "ct-02");

    const group = screen.getByLabelText(STEP_TITLES.recipient);
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(
      screen.getByRole("radio", { name: "Dr. J. de Vries, GP", checked: false }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("radio", { name: "M. Bakker, Practice nurse", checked: true }),
    ).toBeOnTheScreen();
  });

  test("tapping a card selects that recipient by id", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderBody(READY);

    await user.press(screen.getByRole("radio", { name: "M. Bakker, Practice nurse" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("ct-02");
  });
});
