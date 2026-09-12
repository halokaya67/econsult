import { onlineManager } from "@tanstack/react-query";
import { userEvent } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, ScrollView, Text, TextInput, View } from "react-native";
import MessageScreen from "@/app/econsult/message";
import { RETRY_LABEL } from "@/components/StatusViews";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { EMPTY_MESSAGE_ERROR } from "@/features/econsult/validation";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/providers";
import { spacing } from "@/theme/tokens";

function SentProbe() {
  const { draft } = useDraft();
  return <Text>{`sent:${draft.econsultId ?? "none"}:${draft.attachment}`}</Text>;
}
const RecipientStub = () => <Text>recipient</Text>;

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const READY_PHOTO = {
  status: "ready",
  pickId: "p1",
  uri: "file:///cache/p.jpg",
  width: 10,
  height: 10,
} as const;
const FIELD = "What would you like to ask?";

function renderMessage(options: ProviderOptions = {}, draft: DraftState = DRAFT) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": RecipientStub,
      "econsult/message": MessageScreen,
      "econsult/sent": SentProbe,
    },
    {
      initialUrl: "/econsult/message",
      wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders>,
    },
  );
}

const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
// getInnerViewRef is mocked by the jest preset but missing from ScrollView's types.
const getInnerViewRef = jest.mocked(
  (ScrollView.prototype as ScrollView & { getInnerViewRef: () => unknown }).getInnerViewRef,
);
// View, Text and TextInput share one measureLayout mock in the jest preset, so which node was
// measured is read from the receiver of the call rather than from a per-component mock.
const measureLayout = jest.mocked(View.prototype.measureLayout);

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
// The field group starts at its label; the input itself sits below the label and the hint.
const FIELD_TOP = 540;
const INPUT_TOP = 620;

describe("Message step", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
  });

  // The offline test leaves react-query's shared online manager offline, which would pause the
  // reads of every test rendered after it.
  afterEach(() => {
    jest.restoreAllMocks();
    onlineManager.setOnline(true);
  });

  test("shows who the message goes to and lets the patient change it", async () => {
    const user = userEvent.setup();
    renderMessage();

    expect(await screen.findByText("To: Dr. J. de Vries")).toBeOnTheScreen();
    expect(screen.getByText("Step 3 of 3")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Change" }));

    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("an empty message is blocked with an error tied to the field and announced", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText(`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(EMPTY_MESSAGE_ERROR);
    expect(focus).toHaveBeenCalledWith(expect.anything(), "focus");
    expect(screen).toHavePathname("/econsult/message");
  });

  test("scrolls the message field into view, so a blocked Send is visible too", async () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation(function (this: unknown, _relativeTo, onSuccess) {
      onSuccess(0, this instanceof TextInput ? INPUT_TOP : FIELD_TOP, 300, 132);
    });
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: FIELD_TOP - spacing.md, animated: true });
    expect(measureLayout.mock.contexts).not.toContainEqual(expect.any(TextInput));
  });

  test("a short message gets a nudge that never blocks sending", async () => {
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "knee hurts");
    expect(screen.getByText(/A little more detail helps/)).toBeOnTheScreen();
    await user.type(screen.getByLabelText(FIELD), " since two weeks after a fall");

    expect(screen.queryByText(/A little more detail helps/)).toBeNull();
  });

  test("sends the message, reports the status, and moves to the confirmation", async () => {
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:none$/)).toBeOnTheScreen();
  });

  test("uploads the photo after the message and reports it attached", async () => {
    const user = userEvent.setup();
    renderMessage({}, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:attached$/)).toBeOnTheScreen();
  });

  test("a failed upload still reaches the confirmation, marked as failed", async () => {
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { upload: "server" } } }, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:failed$/)).toBeOnTheScreen();
  });

  test("a failed create shows a plain-language error with retry and stays on the step", async () => {
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach your practice", {
      exact: false,
    });
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
    expect(screen).toHavePathname("/econsult/message");
  });

  test("Retry re-sends with the idempotency key of the first attempt", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const randomUUID = jest.mocked(Crypto.randomUUID);
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("alert");
    announce.mockClear();
    randomUUID.mockClear();

    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    await waitFor(() => expect(announce).toHaveBeenCalledWith("Sending your message"));
    expect(randomUUID).not.toHaveBeenCalled();
  });

  test("Send is disabled with a spoken reason while offline", async () => {
    renderMessage({ settings: { forceOffline: true } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("You're offline. Sending needs a connection.");
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/);
  });

  test("Send is disabled while a photo is still preparing", async () => {
    renderMessage({}, { ...DRAFT, photo: { status: "preparing", pickId: "p1" } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("Wait for the photo to finish preparing");
  });
});
