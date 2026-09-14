import { router } from "expo-router";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Alert, Text } from "react-native";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/renderWithProviders";
import { initialDraft, type DraftState } from "../state/draft";
import { useDiscardGuard } from "./useDiscardGuard";

const GUARDED_DRAFT: DraftState = { ...initialDraft, message: "My knee hurts" };

function HomeStub() {
  return <Text>home</Text>;
}

// The guard prevents a screen's removal, so it is driven through a screen inside the flow's stack.
const guardedScreen = (draft: DraftState) =>
  function GuardedScreen() {
    useDiscardGuard(draft);
    return <Text>step one</Text>;
  };

function renderGuarded(draft: DraftState) {
  renderRouter(
    {
      index: HomeStub,
      "econsult/_layout": flowLayoutWith(),
      "econsult/recipient": guardedScreen(draft),
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

describe("useDiscardGuard", () => {
  afterEach(() => jest.restoreAllMocks());

  test("asks before leaving while the draft holds unsent content", () => {
    const alert = spyOnAlert();
    renderGuarded(GUARDED_DRAFT);

    act(() => router.back());

    expect(alert).toHaveBeenCalledWith(
      "Discard your message?",
      expect.any(String),
      expect.any(Array),
    );
    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("choosing Discard lowers the guard and leaves for home", async () => {
    const alert = spyOnAlert();
    renderGuarded(GUARDED_DRAFT);
    act(() => router.back());

    pressDialogButton(alert, "Discard");

    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  // Keep writing is a no-op by design, so the second back is what shows the guard is still armed.
  test("leaves the guard armed after Keep writing, so the next back asks again", () => {
    const alert = spyOnAlert();
    renderGuarded(GUARDED_DRAFT);
    act(() => router.back());

    pressDialogButton(alert, "Keep writing");

    expect(screen).toHavePathname("/econsult/recipient");
    act(() => router.back());
    expect(alert).toHaveBeenCalledTimes(2);
  });

  test("lets a draft with nothing to lose leave at once", async () => {
    const alert = spyOnAlert();
    renderGuarded(initialDraft);

    act(() => router.back());

    expect(alert).not.toHaveBeenCalled();
    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
