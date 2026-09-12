import { userEvent } from "@testing-library/react-native";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { router } from "expo-router";
import { Alert, Text } from "react-native";
import HomeScreen from "@/app/index";
import RecipientScreen from "@/app/econsult/recipient";
import { RETRY_LABEL } from "@/components/StatusViews";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { STEP_TITLES } from "@/features/econsult/steps";
import * as useRecipientsModule from "@/features/econsult/useRecipients";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/providers";

const Stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

function renderFlow(
  options: ProviderOptions = {},
  draft?: DraftState,
  initialUrl = "/econsult/recipient",
) {
  return renderRouter(
    {
      index: HomeScreen,
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": RecipientScreen,
      "econsult/questions": Stub("questions"),
      "econsult/message": Stub("message"),
    },
    {
      initialUrl,
      wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders>,
    },
  );
}

async function pressHome(user: ReturnType<typeof userEvent.setup>) {
  const header = screen.queryByRole("button", { name: "Home" });
  if (header) return user.press(header);
  // The native header is not always part of the test tree; drive the same navigation directly.
  act(() => router.dismissTo("/"));
}

describe("Recipient step", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows a loading indicator, then the writable care team as radio cards", async () => {
    renderFlow({ settings: { latencyMs: 50 } });

    expect(
      screen.getByRole("progressbar", { name: "Loading your practice's care team" }),
    ).toBeOnTheScreen();
    expect(await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" })).toBeOnTheScreen();
    expect(screen.getByLabelText(STEP_TITLES.recipient)).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "M. Bakker, Practice nurse" })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "S. Jansen, Practice assistant" })).toBeOnTheScreen();
    expect(screen.queryByRole("radio", { name: "Dr. P. Mulder, GP" })).toBeNull();
    expect(screen.getByText("Step 1 of 3")).toBeOnTheScreen();
  });

  test("Continue is disabled with a reason until a recipient is chosen, then goes to the questions", async () => {
    const user = userEvent.setup();
    renderFlow();
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    const disabled = screen.getByRole("button", { name: "Continue", disabled: true });
    expect(disabled.props.accessibilityHint).toBe("Choose who you are writing to first");
    await user.press(screen.getByRole("radio", { name: "Dr. J. de Vries, GP" }));
    expect(
      screen.getByRole("radio", { name: "Dr. J. de Vries, GP", checked: true }),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/questions");
  });

  test("drops the Continue hint once a recipient is chosen", async () => {
    const user = userEvent.setup();
    renderFlow();
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    await user.press(screen.getByRole("radio", { name: "Dr. J. de Vries, GP" }));

    const enabled = screen.getByRole("button", { name: "Continue", disabled: false });
    expect(enabled.props.accessibilityHint).toBeUndefined();
  });

  test("goes straight to the message when the practice has no questions", async () => {
    const user = userEvent.setup();
    renderFlow({ settings: { practiceId: "prc-0873" } });
    await user.press(await screen.findByRole("radio", { name: "Dr. A. Visser, GP" }));

    expect(screen.getByText("Step 1 of 2")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
  });

  test("preselects the only writable recipient", async () => {
    jest.spyOn(useRecipientsModule, "useRecipients").mockReturnValue({
      status: "ready",
      questions: [],
      recipients: [{ id: "ct-44", displayName: "Dr. A. Visser", role: "gp" }],
    });
    renderFlow();

    expect(
      await screen.findByRole("radio", { name: "Dr. A. Visser, GP", checked: true }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue", disabled: false })).toBeOnTheScreen();
  });

  test("shows an error with retry when the practice details fail to load", async () => {
    renderFlow({ settings: { faults: { config: "server" } } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't load your practice's details",
      { exact: false },
    );
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
  });

  test("shows the empty state when the practice lists no recipients", async () => {
    renderFlow({ settings: { practiceId: "prc-0000" } });

    expect(
      await screen.findByRole("header", {
        name: "Your practice hasn't switched on e-consults in the app yet",
      }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Back to start" })).toBeOnTheScreen();
  });

  test("leaving with a typed message asks before discarding", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderFlow({}, { ...initialDraft, message: "My knee hurts" }, "/");
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    await pressHome(user);

    expect(alert).toHaveBeenCalledWith(
      "Discard your message?",
      expect.any(String),
      expect.any(Array),
    );
    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("leaving without content goes home at once", async () => {
    const user = userEvent.setup();
    renderFlow({}, undefined, "/");
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    await pressHome(user);

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
