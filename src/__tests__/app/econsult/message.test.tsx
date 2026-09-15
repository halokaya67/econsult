import { onlineManager } from "@tanstack/react-query";
import { fireEvent, userEvent, within } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import {
  AccessibilityInfo,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as servicesModule from "@/api/services";
import MessageScreen from "@/app/econsult/message";
import {
  CHOOSE_PHOTO_LABEL,
  REMOVE_PHOTO_LABEL,
} from "@/features/econsult/components/PhotoPicker/PhotoPicker";
import { initialDraft, sentSubmission, type DraftState } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { EMPTY_MESSAGE_ERROR } from "@/features/econsult/utils/validation";
import { RETRY_LABEL } from "@/lib/copy";
import * as networkModule from "@/providers/NetworkProvider";
import { flowLayoutWith } from "@/test/flowLayout";
import { deletedPhotoUris, forgetDeletedPhotos } from "@/test/photoFiles";
import { TestProviders, type ProviderOptions } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";

// Jest renders no layout, so the text-size hook is the only place a live Dynamic Type change can be
// simulated; every other test keeps the real window metrics.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => {
  const { Dimensions: realDimensions } = jest.requireActual("react-native");
  return { __esModule: true, default: jest.fn(() => realDimensions.get("window")) };
});

function SentProbe() {
  const { draft } = useDraft();
  const sent = sentSubmission(draft);
  return <Text>{sent ? `sent:${sent.econsultId}:${sent.attachment}` : "sent:none"}</Text>;
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
const SENT_STATUS = "Message sent";
const SENT_WITH_PHOTO_STATUS = "Message sent, adding your photo";
const OFFLINE_HINT_LINE = "You're offline. Sending needs a connection.";
const CARD_SENTENCE = "We couldn't reach your practice.";

// @testing-library/react-native does not re-export the node type its queries return.
type RenderedNode = ReturnType<typeof screen.getByText>;

// The name the focused node carried at the moment focus was sent, which is the name VoiceOver
// reads out; a focus sent before the error is committed still records the name without it.
function nameWhenFocused(node: unknown): string | undefined {
  return (node as { props?: { accessibilityLabel?: string } }).props?.accessibilityLabel;
}

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

// Stands in for the layout pass that follows the native mount; nothing lays out in a test renderer.
function layOut(node: RenderedNode) {
  fireEvent(node, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } } });
}

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

// Counts the creates the real fake receives, so a double press can be judged by what reached it.
function countCreates() {
  const createServices = servicesModule.createServices;
  const create = jest.fn();
  jest.spyOn(servicesModule, "createServices").mockImplementation((transport) => {
    const services = createServices(transport);
    create.mockImplementation(services.createEConsult);
    return { ...services, createEConsult: create };
  });
  return create;
}

function setFontScale(fontScale: number): void {
  jest.mocked(useWindowDimensions).mockReturnValue({ ...Dimensions.get("window"), fontScale });
}

describe("Message step", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
    jest.mocked(useWindowDimensions).mockReturnValue(Dimensions.get("window"));
    forgetDeletedPhotos();
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

  test("a short message shows the nudge and speaks it once, with no live region", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Sore knee");
    await user.type(screen.getByLabelText(FIELD), " since");

    const nudge = screen.getByText(/A little more detail/);
    expect(nudge.props.accessibilityLiveRegion).toBeUndefined();
    expect(
      announce.mock.calls.filter(([line]) => line.startsWith("A little more detail")),
    ).toHaveLength(1);
  });

  // The text size can be changed from the control centre mid-message, which lays the step out
  // again; the nudge is still the same one, already on screen and already heard.
  test("a text-size change with the nudge on screen does not speak it again", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    setFontScale(1);
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "Sore knee");
    const inputBefore = screen.getByLabelText(FIELD);

    setFontScale(2);
    // The first change after the new scale re-renders the step, which remounts it; one event, so
    // nothing else is fired at the old input.
    fireEvent.changeText(screen.getByLabelText(FIELD), "Sore knees");

    expect(screen.getByLabelText(FIELD)).not.toBe(inputBefore);
    expect(screen.getByText(/A little more detail/)).toBeOnTheScreen();
    expect(
      announce.mock.calls.filter(([line]) => line.startsWith("A little more detail")),
    ).toHaveLength(1);
  });

  test("an empty message is blocked with an error spoken by moving focus to the field", async () => {
    const namesWhenFocused: (string | undefined)[] = [];
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    announce.mockClear();
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation((node) => void namesWhenFocused.push(nameWhenFocused(node)));
    focus.mockClear();
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: "Send" }));

    // One focus move, made late enough that the name it speaks already carries the error; the
    // focused input is named with the error, so announcing it too would speak it twice.
    expect(screen.getByLabelText(`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`)).toBeOnTheScreen();
    expect(focus).toHaveBeenCalledWith(expect.any(TextInput), "focus");
    expect(namesWhenFocused).toEqual([`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`]);
    expect(announce.mock.calls.filter(([line]) => line === EMPTY_MESSAGE_ERROR)).toHaveLength(0);
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

  // "Message sent" is the confirmation's heading, which is read when focus lands on it there.
  test("sends the message and moves to the confirmation without speaking its heading", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:none$/)).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line === SENT_STATUS)).toHaveLength(0);
  });

  test("two presses of Send in the same tick create one e-consult", async () => {
    const create = countCreates();
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");

    // Both presses inside one act: nothing re-renders between them, as with two real taps.
    const send = screen.getByRole("button", { name: "Send" });
    act(() => {
      fireEvent.press(send);
      fireEvent.press(send);
    });

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/^sent:ec-\d+:none$/)).toHaveLength(1);
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

  test("uploads the photo after the message, speaking the interim status once", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    const user = userEvent.setup();
    renderMessage({}, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:attached$/)).toBeOnTheScreen();
    // The upload still runs when it is spoken, so it reports progress the confirmation cannot.
    expect(announce.mock.calls.filter(([line]) => line === SENT_WITH_PHOTO_STATUS)).toHaveLength(1);
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
  test("a failed create scrolls its error card into view and speaks it by focus alone", async () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, CARD_TOP, 300, 200));
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");

    await user.press(screen.getByRole("button", { name: "Send" }));
    const card = await screen.findByRole("alert");

    // Fabric holds no view for the card in the commit that inserted it, so nothing moves yet.
    expect(scrollTo).not.toHaveBeenCalled();
    layOut(card);

    // The message passed validation, so the card is the only node measured or focused.
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: CARD_TOP - spacing.md, animated: true });
    expect(focus).toHaveBeenCalledWith(measureLayout.mock.contexts[0], "focus");
    // The focused card is named with the whole sentence, so announcing it would speak it twice.
    expect(announce.mock.calls.filter(([line]) => line.includes(CARD_SENTENCE))).toHaveLength(0);
  });

  // The error is cleared while the retry is in flight, so a second failure is a second card; it
  // would go unspoken if the reveal were tied to the first appearance alone.
  test("a retry that fails again brings the card back and speaks it again", async () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    focus.mockClear();
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");
    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));
    const firstCard = await screen.findByRole("alert");
    layOut(firstCard);

    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));
    await waitFor(() => expect(firstCard).not.toBeOnTheScreen());
    layOut(await screen.findByRole("alert"));

    expect(focus).toHaveBeenCalledTimes(2);
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

  // At the largest text size the step is about two screens tall, so the banner explaining the dead
  // Send is off-screen by the time the patient has scrolled to it.
  test("repeats the offline reason under Send, as copy only", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    announce.mockClear();
    renderMessage({ settings: { forceOffline: true } });
    await screen.findByText("To: Dr. J. de Vries");

    // getByText lands on the host text inside RN's Text, so the block it shares with Send is two up.
    const block = screen.getByText(OFFLINE_HINT_LINE).parent?.parent as RenderedNode;

    expect(within(block).getByRole("button", { name: "Send", disabled: true })).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line === OFFLINE_HINT_LINE)).toHaveLength(0);
  });

  test("leaves the reason out from under Send while online", async () => {
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    expect(screen.queryByText(OFFLINE_HINT_LINE)).toBeNull();
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

  // Remove is not the end of the flow, so it takes nothing off the device; the sweep when the flow
  // is left covers the picked file and the downscaled one it was turned into.
  test("both files a pick wrote survive Remove and go when the flow is left", async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const { unmount } = renderMessage();
    await screen.findByText("To: Dr. J. de Vries");
    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));
    await screen.findByLabelText("Your photo");

    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));

    expect(deletedPhotoUris()).toEqual([]);
    unmount();
    expect(deletedPhotoUris()).toEqual([ASSET.uri, "file:///cache/processed.jpg"]);
  });

  test("Send is disabled while a photo is still preparing", async () => {
    renderMessage({}, { ...DRAFT, photo: { status: "preparing", pickId: "p1" } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("Wait for the photo to finish preparing");
  });
});
