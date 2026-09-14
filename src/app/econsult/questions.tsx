import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { Question } from "@/api/contracts";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { StepHeader } from "@/components/StepHeader";
import { TextField } from "@/components/TextField";
import { useQuestions } from "@/features/econsult/hooks/useQuestions";
import { useDraft } from "@/features/econsult/state/DraftProvider";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/utils/steps";
import { validateAnswers, type AnswerErrors } from "@/features/econsult/utils/validation";
import { useScrollToField, type ScrollToField } from "@/hooks/useScrollToField";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";

function requirementOf(question: Question) {
  return question.required ? "required" : "optional";
}

function withoutKey(errors: AnswerErrors, key: string): AnswerErrors {
  const { [key]: _removed, ...rest } = errors;
  return rest;
}

type SetNode = (node: Focusable | null) => void;

type FieldProps = {
  question: Question;
  value: string | null;
  error: string | undefined;
  onChange: (value: string) => void;
  // A failed Continue scrolls to the anchor and focuses the focus node. A choice group has no
  // input, so its label serves as both.
  anchorRef: SetNode;
  focusRef: SetNode;
};

function QuestionField({ question, value, error, onChange, anchorRef, focusRef }: FieldProps) {
  const requirement = requirementOf(question);
  if (question.type === "choice") {
    return (
      <ChoiceGroup
        ref={(node) => {
          anchorRef(node);
          focusRef(node);
        }}
        label={question.label}
        requirement={requirement}
        options={question.options}
        value={value}
        onChange={onChange}
        error={error}
      />
    );
  }
  return (
    <TextField
      containerRef={anchorRef}
      ref={focusRef}
      label={question.label}
      requirement={requirement}
      value={value ?? ""}
      onChangeText={onChange}
      error={error}
      multiline
    />
  );
}

// Rendered inside the scaffold, so unlike the screen itself it can reach the scroll view.
function ContinueButton({ onContinue }: { onContinue: (scrollToField: ScrollToField) => void }) {
  const scrollToField = useScrollToField();
  return <PrimaryButton label="Continue" onPress={() => onContinue(scrollToField)} />;
}

type NodesByQuestion = Map<string, Focusable | null>;

export default function QuestionsScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const questions = useQuestions();
  const [errors, setErrors] = useState<AnswerErrors>({});
  const anchorNodes = useRef<NodesByQuestion>(new Map());
  const focusNodes = useRef<NodesByQuestion>(new Map());

  function answer(questionId: string, value: string) {
    dispatch({ type: "answerChanged", questionId, value });
    setErrors((current) => withoutKey(current, questionId));
  }

  function onContinue(scrollToField: ScrollToField) {
    const next = validateAnswers(questions, draft.answers);
    setErrors(next);
    const firstInvalid = questions.find((question) => next[question.id]);
    if (!firstInvalid) {
      router.push("/econsult/message");
      return;
    }
    // Scroll before announcing: screen-reader focus alone leaves the screen looking untouched.
    scrollToField(anchorNodes.current.get(firstInvalid.id) ?? null);
    announce(next[firstInvalid.id]);
    focusForScreenReader(focusNodes.current.get(firstInvalid.id) ?? null);
  }

  return (
    <ScreenScaffold action={<ContinueButton onContinue={onContinue} />}>
      <StepHeader
        stepNumber={stepNumber("questions", true)}
        stepCount={stepCount(true)}
        title={STEP_TITLES.questions}
      />
      {questions.map((question) => (
        <QuestionField
          key={question.id}
          question={question}
          value={draft.answers[question.id] ?? null}
          error={errors[question.id]}
          onChange={(value) => answer(question.id, value)}
          anchorRef={(node) => void anchorNodes.current.set(question.id, node)}
          focusRef={(node) => void focusNodes.current.set(question.id, node)}
        />
      ))}
    </ScreenScaffold>
  );
}
