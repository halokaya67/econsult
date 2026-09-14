import { onlineManager } from "@tanstack/react-query";
import { userEvent } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, ScrollView, Text, TextInput, View } from "react-native";
import * as servicesModule from "@/api/services";
import MessageScreen from "@/app/econsult/message";
import { CHOOSE_PHOTO_LABEL, REMOVE_PHOTO_LABEL } from "@/features/econsult/components/PhotoPicker";
import { initialDraft, type DraftState } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { EMPTY_MESSAGE_ERROR } from "@/features/econsult/utils/validation";
import { RETRY_LABEL } from "@/lib/retryLabel";
import * as networkModule from "@/providers/NetworkProvider";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";

function SentProbe() {
  const { draft } = useDraft();
  return <Text>{`sent:${draft.econsultId ?? "none"}:${draft.attachment}`}</Text>;
}
const RecipientStub = () => <Text>recipient</Text>;

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const ASSET = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };
const READY_PHOTO = {
  status: "ready",
  pickId: "p1",
  uri: "file:///cache/p.jpg",
  width: 10,
  height: 10,
} as const;
const FIELD = "What would you like to ask?";
const SENDING_STATUS = "Sending your message";

function renderMessage(
  options: ProviderOptions = {},
  draft: DraftState = DRAFT,
  initialUrl = "/econsult/message",
) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": RecipientStub,
      "econsult/message": MessageScreen,
      "econsult/sent": SentProbe,
    },
    {
      initialUrl,
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
// Latency for the in-flight-send tests: far enough past the first renders that no stale render of
// the leave guard can be what lets navigation through.
const SEND_LATENCY_MS = 120;
// Latency for the reads, so the first render lands while the practice config is still in flight.
const READ_LATENCY_MS = 50;
// The field group starts at its label; the input itself sits below the label and the hint.
const FIELD_TOP = 540;
const INPUT_TOP = 620;
// The error card is inserted below the photo block, far enough down to be off a short screen.
const CARD_TOP = 880;

// Only an ApiError comes out of the fake transport, so a plain bug in the upload is injected here.
function breakTheUpload() {
  const createServices = servicesModule.createServices;
  jest.spyOn(servicesModule, "createServices").mockImplementation((transport) => ({
    ...createServices(transport),
    uploadAttachment: async () => {
      throw new TypeError("bug");
    },
  }));
}

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

  // A deep link lands here before the config says whether the practice asks questions, and a header
  // rendered on that first guess would count "2 of 2" out loud and then "3 of 3".
  test("holds the step header back until the config resolves, then announces it once", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();

    renderMessage({ settings: { latencyMs: READ_LATENCY_MS } });
    expect(screen.queryByText(/^Step/)).toBeNull();

    expect(await screen.findByText("Step 3 of 3")).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line.startsWith("Step"))).toHaveLength(1);
  });

  test("an empty message is blocked with an error tied to the field and announced", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    announce.mockClear();
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText(`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`)).toBeOnTheScreen();
    // Filtered, so the StepHeader's own mount announcement stays out of the count.
    expect(announce.mock.calls.filter(([line]) => line === EMPTY_MESSAGE_ERROR)).toHaveLength(1);
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

  test("typing after a blocked Send takes the error off the field", async () => {
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await user.type(
      screen.getByLabelText(`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`),
      "My knee has hurt for two weeks",
    );

    expect(screen.getByLabelText(FIELD)).toBeOnTheScreen();
    expect(screen.queryByText(EMPTY_MESSAGE_ERROR)).toBeNull();
  });

  test("Send sends nothing while the draft has no recipient, and says so in development", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    renderMessage({}, { ...initialDraft, message: "My knee has hurt for two weeks" });
    await screen.findByText("To: your practice");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.queryByText(SENDING_STATUS)).toBeNull();
    expect(screen).toHavePathname("/econsult/message");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no recipient"));
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

  test("the sending status is spoken once, by the announcement and not by a live region", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    const user = userEvent.setup();
    renderMessage({ settings: { latencyMs: SEND_LATENCY_MS } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText(SENDING_STATUS).props.accessibilityLiveRegion).toBeUndefined();
    expect(announce.mock.calls.filter(([line]) => line === SENDING_STATUS)).toHaveLength(1);
    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
  });

  test("Change and going back wait while the send is in flight", async () => {
    const user = userEvent.setup();
    // Pushed from step 1, so there is a screen to go back to for the guard to hold on to.
    renderMessage({ settings: { latencyMs: SEND_LATENCY_MS } }, DRAFT, "/econsult/recipient");
    act(() => router.push("/econsult/message"));
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("button", { name: "Change", disabled: true })).toBeOnTheScreen();
    act(() => router.back());
    expect(screen).toHavePathname("/econsult/message");
    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
  });

  test("a replace while the send is in flight goes through instead of being swallowed", async () => {
    const user = userEvent.setup();
    renderMessage({ settings: { latencyMs: SEND_LATENCY_MS } }, DRAFT, "/econsult/recipient");
    act(() => router.push("/econsult/message"));
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    act(() => router.replace("/econsult/sent"));

    expect(screen).toHavePathname("/econsult/sent");
    await waitFor(() => expect(screen.getByText(/^sent:ec-\d+:none$/)).toBeOnTheScreen());
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

  test("an upload that fails unexpectedly still reaches the confirmation, marked as failed", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    breakTheUpload();
    const user = userEvent.setup();
    renderMessage({}, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:failed$/)).toBeOnTheScreen();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bug"));
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

  // Inserted above Send, the card pushed it and Try again below the fold and nothing scrolled.
  test("a failed create scrolls its error card into view and moves focus to it", async () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, CARD_TOP, 300, 200));
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");

    await user.press(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("alert");

    // The message passed validation, so the card is the only node measured or focused.
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: CARD_TOP - spacing.md, animated: true });
    expect(focus).toHaveBeenCalledWith(measureLayout.mock.contexts[0], "focus");
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

    await waitFor(() => expect(announce).toHaveBeenCalledWith(SENDING_STATUS));
    expect(randomUUID).not.toHaveBeenCalled();
    // The retry fails too, which lifts the lock the send put on Change and on going back; act spans
    // the wait because the leave-guard's own state cascade would otherwise land between its polls.
    await act(async () => {
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Change", disabled: false })).toBeOnTheScreen(),
      );
    });
  });

  test("Retry after a failed create is disabled while offline, just like Send", async () => {
    const user = userEvent.setup();
    // The provider reads the network mock once per mount, so the link is flipped at the hook.
    const isOffline = jest.spyOn(networkModule, "useIsOffline").mockReturnValue(false);
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("alert");

    isOffline.mockReturnValue(true);
    await user.type(screen.getByLabelText(FIELD), " now");

    const retry = screen.getByRole("button", { name: RETRY_LABEL, disabled: true });
    expect(retry.props.accessibilityHint).toBe("You're offline. Sending needs a connection.");
  });

  test("Send is disabled with a spoken reason while offline", async () => {
    renderMessage({ settings: { forceOffline: true } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("You're offline. Sending needs a connection.");
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/);
  });

  test("a picked photo becomes the draft's preview and Remove takes it back out", async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(await screen.findByLabelText("Your photo")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));
    expect(screen.queryByLabelText("Your photo")).toBeNull();
    expect(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL })).toBeOnTheScreen();
  });

  test("Send is disabled while a photo is still preparing", async () => {
    renderMessage({}, { ...DRAFT, photo: { status: "preparing", pickId: "p1" } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("Wait for the photo to finish preparing");
  });
});
