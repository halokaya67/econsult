import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import { OFFLINE_HINT } from "@/lib/copy";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/renderWithProviders";
import { PREPARING_HINT, SendButton } from "./SendButton";
import { useMessageSend } from "../hooks/useMessageSend";
import { initialDraft, type DraftState } from "../state/draft";

type ButtonProps = { isOffline?: boolean; isPreparing?: boolean };

const DRAFT: DraftState = {
  ...initialDraft,
  recipientId: "ct-11",
  message: "My knee has hurt for two weeks",
};
// Long enough for the in-flight render to land before the confirmation replaces the step.
const SEND_LATENCY_MS = 50;

const Sent = () => <Text>sent</Text>;

// The button reads the send the way the message step wires it, so a press runs the real send.
function buttonWith({ isOffline = false, isPreparing = false }: ButtonProps) {
  return function ButtonProbe() {
    const send = useMessageSend();
    return <SendButton send={send} isOffline={isOffline} isPreparing={isPreparing} />;
  };
}

function renderButton(props: ButtonProps = {}, options: ProviderOptions = {}) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(DRAFT),
      "econsult/message": buttonWith(props),
      "econsult/sent": Sent,
    },
    {
      initialUrl: "/econsult/message",
      wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders>,
    },
  );
}

describe("SendButton", () => {
  test("sends the draft, showing Sending while the send is in flight", async () => {
    const user = userEvent.setup();
    renderButton({}, { settings: { latencyMs: SEND_LATENCY_MS } });

    const send = screen.getByRole("button", { name: "Send", disabled: false });
    expect(send.props.accessibilityHint).toBeUndefined();
    await user.press(send);

    expect(screen.getByRole("button", { name: "Sending", busy: true })).toBeOnTheScreen();
    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
  });

  test("is disabled with the offline reason as its hint, repeated under it as copy only", () => {
    renderButton({ isOffline: true });

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe(OFFLINE_HINT);
    expect(screen.getByText(OFFLINE_HINT).props.accessibilityLiveRegion).toBeUndefined();
  });

  test("is disabled with the preparing reason while the photo is still preparing", () => {
    renderButton({ isPreparing: true });

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe(PREPARING_HINT);
    expect(screen.queryByText(OFFLINE_HINT)).toBeNull();
  });

  test("names the offline reason over the photo when both hold Send back", () => {
    renderButton({ isOffline: true, isPreparing: true });

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe(OFFLINE_HINT);
  });
});
