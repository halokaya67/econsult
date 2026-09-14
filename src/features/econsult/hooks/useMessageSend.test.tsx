import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, Text } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/providers";
import * as submitModule from "../api/submit";
import { initialDraft, type DraftState } from "../state/draft";
import { useMessageSend } from "./useMessageSend";

const DRAFT: DraftState = {
  ...initialDraft,
  recipientId: "ct-11",
  message: "My knee has hurt for two weeks",
};
const SEND_TWICE = "Send twice";
const SENDING_STATUS = "Sending your message";
const SENT_STATUS = "Message sent";
const noScroll = () => {};

// Two calls inside one press stand in for the second tap that lands before TanStack's scheduler has
// told React the mutation is pending.
function SendProbe() {
  const send = useMessageSend();
  return (
    <PrimaryButton
      label={SEND_TWICE}
      onPress={() => {
        void send.onSend(noScroll);
        void send.onSend(noScroll);
      }}
    />
  );
}

const Sent = () => <Text>sent</Text>;

function renderProbe() {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(DRAFT),
      "econsult/message": SendProbe,
      "econsult/sent": Sent,
    },
    {
      initialUrl: "/econsult/message",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
}

describe("useMessageSend", () => {
  afterEach(() => jest.restoreAllMocks());

  test("ignores a second send that lands inside the first one's tick", async () => {
    const send = jest.spyOn(submitModule, "submitEConsult");
    const user = userEvent.setup();
    renderProbe();

    await user.press(screen.getByRole("button", { name: SEND_TWICE }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(send).toHaveBeenCalledTimes(1);
  });

  test("speaks each status once, at the moment it is set", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    announce.mockClear();
    const user = userEvent.setup();
    renderProbe();

    await user.press(screen.getByRole("button", { name: SEND_TWICE }));

    await waitFor(() => expect(announce).toHaveBeenCalledWith(SENT_STATUS));
    expect(announce.mock.calls.filter(([line]) => line === SENDING_STATUS)).toHaveLength(1);
    expect(announce.mock.calls.filter(([line]) => line === SENT_STATUS)).toHaveLength(1);
  });
});
