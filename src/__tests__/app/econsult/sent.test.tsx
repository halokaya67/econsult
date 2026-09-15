import { fireEvent, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, Text } from "react-native";
import SentScreen from "@/app/econsult/sent";
import * as submitModule from "@/features/econsult/api/submit";
import * as retryModule from "@/features/econsult/hooks/useRetryAttachment";
import { initialDraft, type DraftState } from "@/features/econsult/state/draft";
import { RETRY_LABEL } from "@/lib/copy";
import * as networkModule from "@/providers/NetworkProvider";
import { flowLayoutWith } from "@/test/flowLayout";
import { deletedPhotoUris, forgetDeletedPhotos } from "@/test/photoFiles";
import { TestProviders } from "@/test/renderWithProviders";

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
  submission: { phase: "sent", econsultId: "ec-1", attachment: "none" },
};

const ATTACHED: DraftState = {
  ...SENT,
  photo: READY_PHOTO,
  submission: { phase: "sent", econsultId: "ec-1", attachment: "attached" },
};
const FAILED: DraftState = {
  ...SENT,
  photo: READY_PHOTO,
  submission: { phase: "sent", econsultId: "ec-1", attachment: "failed" },
};
const PHOTO_FAILED_LINE = "Your message was sent, but the photo could not be attached.";
// Long enough to outlast the arrival fallback, which is itself longer than a push transition.
const ARRIVAL_TIMEOUT_MS = 3000;

// Which element the arrival focus landed on: the heading, or the alert whose name is the
// photo-failed sentence.
function roleWhenFocused(node: unknown): string | undefined {
  return (node as { props?: { accessibilityRole?: string } }).props?.accessibilityRole;
}

function spyOnFocus(rolesWhenFocused: (string | undefined)[]) {
  const focus = jest
    .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
    .mockImplementation((node) => void rolesWhenFocused.push(roleWhenFocused(node)));
  // The preset already mocks it, so the spy is the mock every earlier test wrote to.
  focus.mockClear();
  return focus;
}

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
  beforeEach(forgetDeletedPhotos);

  afterEach(() => jest.restoreAllMocks());

  test("confirms who received the message and gives the reference", async () => {
    renderSent(SENT);

    expect(screen.getByRole("header", { name: "Message sent" })).toBeOnTheScreen();
    expect(await screen.findByText("Sent to Dr. J. de Vries.")).toBeOnTheScreen();
    expect(screen.getByText(/Reference: ec-1/)).toBeOnTheScreen();
    expect(screen.getByText(/two working days/)).toBeOnTheScreen();
  });

  // VoiceOver drops a focus move made while the push transition is still running, which left the
  // confirmation silent; nothing reports that transition in a test, so the fallback focuses here.
  test("focuses the heading only once the screen has finished arriving", async () => {
    const rolesWhenFocused: (string | undefined)[] = [];
    const focus = spyOnFocus(rolesWhenFocused);
    renderSent(SENT);
    await screen.findByText("Sent to Dr. J. de Vries.");

    expect(focus).not.toHaveBeenCalled();

    await waitFor(() => expect(rolesWhenFocused).toEqual(["header"]), {
      timeout: ARRIVAL_TIMEOUT_MS,
    });
    expect(focus).toHaveBeenCalledTimes(1);
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

  // The photo may be of a rash, and the flow is the only thing that could still need the file.
  test("Done takes the photo file off the device", async () => {
    const user = userEvent.setup();
    renderSent(ATTACHED);
    await screen.findByText("Sent to Dr. J. de Vries.");

    await user.press(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
    await waitFor(() => expect(deletedPhotoUris()).toEqual([READY_PHOTO.uri]));
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

  // The alert's name is the photo-failed sentence, so the arrival focus is what speaks it; the
  // heading focus and an announcement as well were three utterances racing, and the line was cut.
  test("a failed photo takes the arrival focus and is not announced as well", async () => {
    const rolesWhenFocused: (string | undefined)[] = [];
    const focus = spyOnFocus(rolesWhenFocused);
    const spoken = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    // The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
    spoken.mockClear();

    renderSent(FAILED);
    await screen.findByRole("alert");

    await waitFor(() => expect(rolesWhenFocused).toEqual(["alert"]), {
      timeout: ARRIVAL_TIMEOUT_MS,
    });
    expect(focus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(PHOTO_FAILED_LINE, { exact: false });
    expect(spoken.mock.calls.filter(([line]) => line === PHOTO_FAILED_LINE)).toHaveLength(0);
    expect(screen.getByRole("alert").props.accessibilityLiveRegion).toBeUndefined();
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
      .spyOn(retryModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof retryModule.useRetryAttachment>);
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

  test("two presses of Try again in the same tick upload the photo once", async () => {
    const retry = { mutateAsync: jest.fn(async () => "attached" as const), isPending: false };
    jest
      .spyOn(retryModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof retryModule.useRetryAttachment>);
    renderSent(FAILED);
    const button = await screen.findByRole("button", { name: RETRY_LABEL });

    fireEvent.press(button);
    fireEvent.press(button);

    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
    expect(retry.mutateAsync).toHaveBeenCalledTimes(1);
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
      .spyOn(retryModule, "useRetryAttachment")
      .mockReturnValue(retry as unknown as ReturnType<typeof retryModule.useRetryAttachment>);
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
    // Spoken by the announcement alone; a live region here would repeat it on Android.
    expect(screen.getByRole("alert").props.accessibilityLiveRegion).toBeUndefined();
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

  test("an attached photo is confirmed", async () => {
    renderSent(ATTACHED);

    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
  });
});
