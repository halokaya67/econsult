import { userEvent } from "@testing-library/react-native";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { router } from "expo-router";
import { AccessibilityInfo, Text } from "react-native";
import SentScreen from "@/app/econsult/sent";
import { RETRY_LABEL } from "@/components/StatusViews";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import * as submitModule from "@/features/econsult/submit";
import * as useSubmitModule from "@/features/econsult/useSubmit";
import * as networkModule from "@/lib/network";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/providers";

const Home = () => <Text>home</Text>;
const Recipient = () => <Text>recipient</Text>;
const READY_PHOTO = {
  status: "ready",
  pickId: "p1",
  uri: "file:///cache/p.jpg",
  width: 10,
  height: 10,
} as const;
const SENT: DraftState = {
  ...initialDraft,
  recipientId: "ct-11",
  message: "Hi",
  econsultId: "ec-1",
  attachment: "none",
};

const FAILED: DraftState = { ...SENT, photo: READY_PHOTO, attachment: "failed" };

// Start on step 1 and push the confirmation on top of it so that "back" has a real target to be
// blocked from.
function renderSent(draft: DraftState) {
  const view = renderRouter(
    {
      index: Home,
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": Recipient,
      "econsult/sent": SentScreen,
    },
    {
      initialUrl: "/econsult/recipient",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
  act(() => router.push("/econsult/sent"));
  return view;
}

describe("Sent", () => {
  afterEach(() => jest.restoreAllMocks());

  test("confirms who received the message, gives the reference, and focuses the heading", async () => {
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    renderSent(SENT);

    expect(screen.getByRole("header", { name: "Message sent" })).toBeOnTheScreen();
    expect(await screen.findByText("Sent to Dr. J. de Vries.")).toBeOnTheScreen();
    expect(screen.getByText(/Reference: ec-1/)).toBeOnTheScreen();
    expect(screen.getByText(/two working days/)).toBeOnTheScreen();
    expect(focus).toHaveBeenCalledWith(expect.anything(), "focus");
  });

  test("cannot be left by going back", async () => {
    renderSent(SENT);
    await screen.findByText("Sent to Dr. J. de Vries.");

    act(() => router.back());

    expect(screen).toHavePathname("/econsult/sent");
  });

  test("Done unwinds the flow to home", async () => {
    const user = userEvent.setup();
    renderSent(SENT);
    await screen.findByText("Sent to Dr. J. de Vries.");

    await user.press(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("a failed photo upload is shown with a retry and a way to continue without it", async () => {
    const user = userEvent.setup();
    renderSent(FAILED);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your message was sent, but the photo could not be attached",
      { exact: false },
    );
    // The fake knows no "ec-1", so the real upload comes back as another failure.
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));
    expect(await screen.findByText(/The photo still couldn't be attached/)).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Continue without the photo" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("Try again is disabled with a spoken reason while offline", async () => {
    // The provider reads the network mock once per mount, so the link is flipped at the hook.
    jest.spyOn(networkModule, "useIsOffline").mockReturnValue(true);
    renderSent(FAILED);

    const retry = await screen.findByRole("button", { name: RETRY_LABEL, disabled: true });

    expect(retry.props.accessibilityHint).toBe("You're offline. Sending needs a connection.");
  });

  test("a successful retry confirms the photo", async () => {
    const retry = { mutateAsync: jest.fn(async () => "attached" as const), isPending: false };
    jest
      .spyOn(useSubmitModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof useSubmitModule.useRetryAttachment>);
    const user = userEvent.setup();
    renderSent(FAILED);

    await user.press(await screen.findByRole("button", { name: RETRY_LABEL }));

    expect(retry.mutateAsync).toHaveBeenCalledWith({
      econsultId: "ec-1",
      photo: { uri: READY_PHOTO.uri, name: "photo.jpg", type: "image/jpeg" },
    });
    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
    expect(screen.queryByText(/The photo still couldn't be attached/)).toBeNull();
  });

  test("a retry that reports another failure is spoken, shown, and leaves both options open", async () => {
    const spoken = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const retry = {
      mutateAsync: jest.fn(async () => "failed" as const),
      isPending: false,
      error: null,
    };
    jest
      .spyOn(useSubmitModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof useSubmitModule.useRetryAttachment>);
    const user = userEvent.setup();
    renderSent(FAILED);

    await user.press(await screen.findByRole("button", { name: RETRY_LABEL }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The photo still couldn't be attached. You can try again or continue without it.",
        { exact: false },
      ),
    );
    expect(spoken).toHaveBeenCalledWith(
      "The photo still couldn't be attached. You can try again or continue without it.",
    );
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue without the photo" })).toBeOnTheScreen();
  });

  test("a retry that fails outright is spoken, shown, and leaves both options open", async () => {
    const spoken = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    jest.spyOn(submitModule, "retryAttachment").mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderSent(FAILED);

    await user.press(await screen.findByRole("button", { name: RETRY_LABEL }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong at our end", {
        exact: false,
      }),
    );
    expect(spoken).toHaveBeenCalledWith("Something went wrong at our end. Please try again.");
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue without the photo" })).toBeOnTheScreen();
  });

  test("a retry uploads nothing when the e-consult reference is missing", async () => {
    const retry = { mutateAsync: jest.fn(), isPending: false, error: null };
    jest
      .spyOn(useSubmitModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof useSubmitModule.useRetryAttachment>);
    const user = userEvent.setup();
    renderSent({ ...SENT, econsultId: null, photo: READY_PHOTO, attachment: "failed" });

    await user.press(await screen.findByRole("button", { name: RETRY_LABEL }));

    expect(retry.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your message was sent, but the photo could not be attached",
      { exact: false },
    );
  });

  test("an attached photo is confirmed", async () => {
    renderSent({ ...SENT, photo: READY_PHOTO, attachment: "attached" });

    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
  });
});
