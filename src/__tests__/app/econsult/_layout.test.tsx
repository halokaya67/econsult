import { userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Alert, Text } from "react-native";
import EConsultLayout, { unstable_settings } from "@/app/econsult/_layout";
import { useDiscardGuard } from "@/features/econsult/hooks/useDiscardGuard";
import { initialDraft, type DraftState } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { TestProviders } from "@/test/renderWithProviders";

const GUARDED_DRAFT: DraftState = { ...initialDraft, message: "My knee hurts" };
const CHOSEN_RECIPIENT_DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };

function DraftProbe() {
  const { draft } = useDraft();
  return <Text>{draft.recipientId ?? "no recipient"}</Text>;
}

const Stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

// Step 1 mounts the guard in the app, so the stub standing in for it does the same.
const guardedScreen = (draft: DraftState) =>
  function GuardedScreen() {
    useDiscardGuard(draft);
    return <Text>step one</Text>;
  };

function renderFlow(draft: DraftState) {
  renderRouter(
    {
      index: Stub("home"),
      "econsult/_layout": EConsultLayout,
      "econsult/recipient": guardedScreen(draft),
      "econsult/questions": Stub("questions"),
      "econsult/message": Stub("message"),
      "econsult/sent": Stub("sent"),
    },
    {
      initialUrl: "/",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
  act(() => router.push("/econsult/recipient"));
}

function spyOnAlert() {
  return jest.spyOn(Alert, "alert").mockImplementation(() => {});
}

function pressDialogButton(alert: ReturnType<typeof spyOnAlert>, text: string) {
  const button = alert.mock.calls.at(-1)?.[2]?.find((candidate) => candidate.text === text);
  expect(button).toBeDefined();
  act(() => button?.onPress?.());
}

// Only the top screen's header is in the tree, so this is the Cancel of the step on show.
async function pressCancel(user: ReturnType<typeof userEvent.setup>) {
  await user.press(screen.getByRole("button", { name: "Cancel" }));
}

function expectDiscardPrompt(alert: ReturnType<typeof spyOnAlert>) {
  expect(alert).toHaveBeenCalledWith(
    "Discard your message?",
    expect.any(String),
    expect.any(Array),
  );
}

describe("EConsultLayout", () => {
  afterEach(() => jest.restoreAllMocks());

  test("provides the draft to its screens and anchors deep links on the first step", () => {
    renderRouter(
      { "econsult/_layout": EConsultLayout, "econsult/recipient": DraftProbe },
      {
        initialUrl: "/econsult/recipient",
        wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
      },
    );

    expect(screen.getByText("no recipient")).toBeOnTheScreen();
    expect(unstable_settings.anchor).toBe("recipient");
  });

  test("Cancel from a later step asks before discarding, and Discard leaves for home", async () => {
    const alert = spyOnAlert();
    const user = userEvent.setup();
    renderFlow(GUARDED_DRAFT);
    act(() => router.push("/econsult/message"));

    await pressCancel(user);

    expectDiscardPrompt(alert);
    expect(screen).toHavePathname("/econsult/message");
    pressDialogButton(alert, "Discard");
    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("Cancel from a later step asks even when only the recipient is chosen", async () => {
    const alert = spyOnAlert();
    const user = userEvent.setup();
    renderFlow(CHOSEN_RECIPIENT_DRAFT);
    act(() => router.push("/econsult/questions"));

    await pressCancel(user);

    expectDiscardPrompt(alert);
    expect(screen).toHavePathname("/econsult/questions");
    pressDialogButton(alert, "Discard");
    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("Cancel from step 1 asks before discarding, and Discard leaves for home", async () => {
    const alert = spyOnAlert();
    const user = userEvent.setup();
    renderFlow(GUARDED_DRAFT);

    await pressCancel(user);

    expectDiscardPrompt(alert);
    expect(screen).toHavePathname("/econsult/recipient");
    pressDialogButton(alert, "Discard");
    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("Cancel with nothing to lose leaves for home at once", async () => {
    const alert = spyOnAlert();
    const user = userEvent.setup();
    renderFlow(initialDraft);

    await pressCancel(user);

    expect(alert).not.toHaveBeenCalled();
    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("the confirmation's header has no Cancel", async () => {
    renderFlow(initialDraft);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();

    act(() => router.replace("/econsult/sent"));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });
});
