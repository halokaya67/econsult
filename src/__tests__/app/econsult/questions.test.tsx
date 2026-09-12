import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { AccessibilityInfo, ScrollView, Text } from "react-native";
import QuestionsScreen from "@/app/econsult/questions";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { REQUIRED_ERROR } from "@/features/econsult/validation";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/providers";
import { spacing } from "@/theme/tokens";

function MessageProbe() {
  const { draft } = useDraft();
  return (
    <Text>
      {`message:${draft.answers["q-duration"] ?? ""}:${draft.answers["q-medication"] ?? ""}`}
    </Text>
  );
}

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const CHOICE = "How long have you had this problem? (required)";
const TEXT = "Are you already taking anything for it? (optional)";

function renderQuestions(draft: DraftState = DRAFT) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/questions": QuestionsScreen,
      "econsult/message": MessageProbe,
    },
    {
      initialUrl: "/econsult/questions",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
}

const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
// getInnerViewRef is mocked by the jest preset but missing from ScrollView's types.
const getInnerViewRef = jest.mocked(
  (ScrollView.prototype as ScrollView & { getInnerViewRef: () => unknown }).getInnerViewRef,
);
const measureLayout = jest.mocked(Text.prototype.measureLayout);

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
const FIELD_TOP = 620;

describe("Questions step", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
  });

  afterEach(() => jest.restoreAllMocks());

  test("renders the practice's questions with their requirement in words", async () => {
    renderQuestions();

    expect(await screen.findByLabelText(CHOICE)).toBeOnTheScreen();
    expect(screen.getByLabelText(TEXT)).toBeOnTheScreen();
    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
  });

  test("blocks Continue on an unanswered required question, ties the error to it, announces and focuses it", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText(`${CHOICE}. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(REQUIRED_ERROR);
    expect(focus).toHaveBeenCalledWith(expect.anything(), "focus");
    expect(screen).toHavePathname("/econsult/questions");
  });

  test("scrolls the first invalid question into view, so a blocked Continue is visible too", async () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, FIELD_TOP, 300, 40));
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: FIELD_TOP - spacing.md, animated: true });
  });

  test("answering clears the error and Continue records the answers in the draft", async () => {
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(CHOICE);
    await user.press(screen.getByRole("button", { name: "Continue" }));

    await user.press(screen.getByRole("radio", { name: "1 to 4 weeks" }));
    expect(screen.queryByText(REQUIRED_ERROR)).toBeNull();
    await user.type(screen.getByLabelText(TEXT), "Paracetamol");
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
    expect(screen.getByText("message:1 to 4 weeks:Paracetamol")).toBeOnTheScreen();
  });

  test("an optional question can be left empty", async () => {
    const user = userEvent.setup();
    renderQuestions({ ...DRAFT, answers: { "q-duration": "Less than a week" } });
    await screen.findByLabelText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
  });
});
