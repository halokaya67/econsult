import { fireEvent, userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, Dimensions, Text, useWindowDimensions } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/renderWithProviders";
import { FIELD_HINT, FIELD_LABEL, MessageField, THIN_NUDGE } from "./MessageField";
import { useMessageSend } from "../hooks/useMessageSend";
import { initialDraft, type DraftState } from "../state/draft";
import { useDraft } from "../state/DraftProvider";
import { EMPTY_MESSAGE_ERROR } from "../utils/validation";

// Jest renders no layout, so the text-size hook is the only place a live Dynamic Type change can be
// simulated; every other test keeps the real window metrics.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => {
  const { Dimensions: realDimensions } = jest.requireActual("react-native");
  return { __esModule: true, default: jest.fn(() => realDimensions.get("window")) };
});

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
// Long enough for the in-flight render to land before the confirmation replaces the step.
const SEND_LATENCY_MS = 50;
const noScroll = () => {};

const Sent = () => <Text>sent</Text>;

// The field reads the draft and the send the way the message step wires them, inside the scaffold
// that tells it a re-layout from an arrival; Send stands in for the step's button.
function FieldProbe() {
  const send = useMessageSend();
  const { draft } = useDraft();
  return (
    <ScreenScaffold
      action={<PrimaryButton label="Send" onPress={() => void send.onSend(noScroll)} />}
    >
      <MessageField send={send} message={draft.message} />
    </ScreenScaffold>
  );
}

function renderField(draft: DraftState = DRAFT, options: ProviderOptions = {}) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/message": FieldProbe,
      "econsult/sent": Sent,
    },
    {
      initialUrl: "/econsult/message",
      wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders>,
    },
  );
}

function spyOnAnnounce() {
  const spoken = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {});
  // The preset already mocks it, so the spy is the mock every earlier test wrote to.
  spoken.mockClear();
  return spoken;
}

function nudgesSpoken(spoken: ReturnType<typeof spyOnAnnounce>): number {
  return spoken.mock.calls.filter(([line]) => line === THIN_NUDGE).length;
}

function setFontScale(fontScale: number): void {
  jest.mocked(useWindowDimensions).mockReturnValue({ ...Dimensions.get("window"), fontScale });
}

describe("MessageField", () => {
  beforeEach(() => jest.mocked(useWindowDimensions).mockReturnValue(Dimensions.get("window")));
  afterEach(() => jest.restoreAllMocks());

  test("shows the label and the hint, and writes typing into the draft", async () => {
    const user = userEvent.setup();
    renderField();

    await user.type(screen.getByLabelText(FIELD_LABEL), "My knee has hurt for two weeks");

    expect(screen.getByText(FIELD_HINT)).toBeOnTheScreen();
    expect(screen.getByLabelText(FIELD_LABEL)).toHaveDisplayValue("My knee has hurt for two weeks");
    expect(screen.queryByText(THIN_NUDGE)).toBeNull();
  });

  test("a short message shows the nudge and speaks it once, with no live region", async () => {
    const spoken = spyOnAnnounce();
    const user = userEvent.setup();
    renderField();

    await user.type(screen.getByLabelText(FIELD_LABEL), "Sore knee");
    await user.type(screen.getByLabelText(FIELD_LABEL), " since");

    const nudge = screen.getByText(THIN_NUDGE);
    expect(nudge.props.accessibilityLiveRegion).toBeUndefined();
    expect(nudgesSpoken(spoken)).toBe(1);
  });

  // The text size can be changed from the control centre mid-message, which lays the step out
  // again; the nudge is still the same one, already on screen and already heard.
  test("a text-size change with the nudge on screen does not speak it again", async () => {
    const spoken = spyOnAnnounce();
    setFontScale(1);
    const user = userEvent.setup();
    renderField();
    await user.type(screen.getByLabelText(FIELD_LABEL), "Sore knee");
    const inputBefore = screen.getByLabelText(FIELD_LABEL);

    setFontScale(2);
    // The first change after the new scale re-renders the step, which remounts it; one event, so
    // nothing else is fired at the old input.
    fireEvent.changeText(screen.getByLabelText(FIELD_LABEL), "Sore knees");

    expect(screen.getByLabelText(FIELD_LABEL)).not.toBe(inputBefore);
    expect(screen.getByText(THIN_NUDGE)).toBeOnTheScreen();
    expect(nudgesSpoken(spoken)).toBe(1);
  });

  test("a blocked Send names the field with its error, and typing takes it off", async () => {
    const user = userEvent.setup();
    renderField();

    await user.press(screen.getByRole("button", { name: "Send" }));

    const named = screen.getByLabelText(`${FIELD_LABEL}. Error: ${EMPTY_MESSAGE_ERROR}`);
    expect(named).toBeOnTheScreen();
    await user.type(named, "My knee has hurt for two weeks");
    expect(screen.getByLabelText(FIELD_LABEL)).toBeOnTheScreen();
    expect(screen.queryByText(EMPTY_MESSAGE_ERROR)).toBeNull();
  });

  test("the field cannot be edited while the send is in flight", async () => {
    const user = userEvent.setup();
    renderField(
      { ...DRAFT, message: "My knee has hurt for two weeks" },
      { settings: { latencyMs: SEND_LATENCY_MS } },
    );

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText(FIELD_LABEL)).toBeDisabled();
    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
  });
});
