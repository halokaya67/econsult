import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { AccessibilityInfo, ScrollView, Text, TextInput, View } from "react-native";
import type { Question } from "@/api/contracts";
import QuestionsScreen from "@/app/econsult/questions";
import * as choiceGroupSource from "@/components/ChoiceGroup";
import * as questionSource from "@/features/econsult/hooks/useQuestions";
import { initialDraft, type DraftState } from "@/features/econsult/state/draft";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { REQUIRED_ERROR } from "@/features/econsult/utils/validation";
import { accessibleName, labelWithRequirement } from "@/lib/fieldLabel";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/renderWithProviders";
import { spacing } from "@/theme/tokens";

function MessageProbe() {
  const { draft } = useDraft();
  return (
    <Text>
      {`message:${draft.answers["q-duration"] ?? ""}:${draft.answers["q-medication"] ?? ""}`}
    </Text>
  );
}

// A choice group that keeps its label and error but never reports a node, so the screen has
// nothing to scroll to or focus.
function NodelessChoiceGroup({
  label,
  requirement,
  error,
}: React.ComponentProps<typeof choiceGroupSource.ChoiceGroup>) {
  return <Text>{accessibleName(labelWithRequirement(label, requirement), error)}</Text>;
}

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const CHOICE = "How long have you had this problem? (required)";
const TEXT = "Are you already taking anything for it? (optional)";

// No fixture practice asks a required text question, so this one is stubbed in where it is needed.
const REQUIRED_TEXT_QUESTION: Question = {
  id: "q-symptom",
  label: "What is bothering you?",
  type: "text",
  required: true,
};
const REQUIRED_TEXT = `${REQUIRED_TEXT_QUESTION.label} (required)`;

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
// View, Text and TextInput share one measureLayout mock in the jest preset, so which node was
// measured is read from the receiver of the call rather than from a per-component mock.
const measureLayout = jest.mocked(Text.prototype.measureLayout);

// StepHeader announces its own title on mount and the announcement mock is shared by the whole
// file, so the error's own announcements are counted apart from it.
function announcementsOf(calls: [string][], message: string): [string][] {
  return calls.filter(([announced]) => announced === message);
}

// The name the focused node carried at the moment focus was sent, which is the name VoiceOver
// reads out; a focus sent before the error is committed still records the name without it.
function nameWhenFocused(node: unknown): string | undefined {
  return (node as { props?: { accessibilityLabel?: string } }).props?.accessibilityLabel;
}

// Stands in for the content view element getInnerViewRef returns under the New Architecture.
const CONTENT_REF = {};
// The field group starts at its label; a text question's input sits below that label.
const FIELD_TOP = 620;
const INPUT_TOP = 700;

describe("Questions step", () => {
  beforeEach(() => {
    scrollTo.mockClear();
    getInnerViewRef.mockReset();
    measureLayout.mockReset();
  });

  afterEach(() => jest.restoreAllMocks());

  test("renders the practice's questions with their requirement in words", async () => {
    renderQuestions();

    expect(await screen.findByText(CHOICE)).toBeOnTheScreen();
    expect(screen.getByLabelText(TEXT)).toBeOnTheScreen();
    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
  });

  test("blocks Continue on an unanswered required question and speaks the error by focusing it", async () => {
    const namesWhenFocused: (string | undefined)[] = [];
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation((node) => void namesWhenFocused.push(nameWhenFocused(node)));
    // The mocks are shared by the file, so clearing keeps the counts below to this test's own calls.
    announce.mockClear();
    focus.mockClear();
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    // One focus move, made late enough that the name it speaks already carries the error; the
    // focused group is named with the error, so announcing it too would speak it twice.
    expect(screen.getByLabelText(`${CHOICE}. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
    expect(focus).toHaveBeenCalledWith(expect.any(View), "focus");
    expect(namesWhenFocused).toEqual([`${CHOICE}. Error: ${REQUIRED_ERROR}`]);
    expect(announcementsOf(announce.mock.calls, REQUIRED_ERROR)).toHaveLength(0);
    expect(screen).toHavePathname("/econsult/questions");
  });

  test("scrolls the first invalid question into view, so a blocked Continue is visible too", async () => {
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, FIELD_TOP, 300, 40));
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: FIELD_TOP - spacing.md, animated: true });
  });

  test("scrolls an empty required text question by its container and focuses its input", async () => {
    jest.spyOn(questionSource, "useQuestions").mockReturnValue([REQUIRED_TEXT_QUESTION]);
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation(function (this: unknown, _relativeTo, onSuccess) {
      onSuccess(0, this instanceof TextInput ? INPUT_TOP : FIELD_TOP, 300, 132);
    });
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(REQUIRED_TEXT);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: FIELD_TOP - spacing.md, animated: true });
    expect(measureLayout.mock.contexts).not.toContainEqual(expect.any(TextInput));
    expect(focus).toHaveBeenCalledWith(expect.any(TextInput), "focus");
  });

  test("a blocked Continue announces the error only when the field reports no node", async () => {
    jest.spyOn(choiceGroupSource, "ChoiceGroup").mockImplementation(NodelessChoiceGroup);
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const focus = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    getInnerViewRef.mockReturnValue(CONTENT_REF);
    measureLayout.mockImplementation((_relativeTo, onSuccess) => onSuccess(0, FIELD_TOP, 300, 40));
    // The preset already mocks these two, so spying hands back one mock shared by the whole file.
    announce.mockClear();
    focus.mockClear();
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText(`${CHOICE}. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
    expect(announcementsOf(announce.mock.calls, REQUIRED_ERROR)).toHaveLength(1);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    expect(screen).toHavePathname("/econsult/questions");
  });

  test("answering clears the error and Continue records the answers in the draft", async () => {
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByText(CHOICE);
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
    await screen.findByText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
  });
});
