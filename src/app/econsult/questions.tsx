import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { Question } from "@/api/contracts";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold, useScrollToField, type ScrollToField } from "@/components/ScreenScaffold";
import { StepHeader } from "@/components/StepHeader";
import { TextField } from "@/components/TextField";
import { useDraft } from "@/features/econsult/DraftProvider";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import { useQuestions } from "@/features/econsult/useQuestions";
import { validateAnswers, type AnswerErrors } from "@/features/econsult/validation";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";

function requirementOf(question: Question) {
  return question.required ? "required" : "optional";
}

function withoutKey(errors: AnswerErrors, key: string): AnswerErrors {
  const { [key]: _removed, ...rest } = errors;
  return rest;
}

type FieldProps = {
  question: Question;
  value: string | null;
  error: string | undefined;
  onChange: (value: string) => void;
  fieldRef: (node: Focusable | null) => void;
};

function QuestionField({ question, value, error, onChange, fieldRef }: FieldProps) {
  const requirement = requirementOf(question);
  if (question.type === "choice") {
    return (
      <ChoiceGroup
        ref={fieldRef}
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
      ref={fieldRef}
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

export default function QuestionsScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const questions = useQuestions();
  const [errors, setErrors] = useState<AnswerErrors>({});
  const fieldRefs = useRef<Map<string, Focusable | null>>(new Map());

  function answer(questionId: string, value: string) {
    dispatch({ type: "answerChanged", questionId, value });
    setErrors((current) => withoutKey(current, questionId));
  }

  function onContinue(scrollToField: ScrollToField) {
    const next = validateAnswers(questions, draft.answers);
    setErrors(next);
    const firstInvalid = questions.find((question) => next[question.id]);
    if (firstInvalid) {
      const node = fieldRefs.current.get(firstInvalid.id) ?? null;
      scrollToField(node);
      announce(next[firstInvalid.id]);
      focusForScreenReader(node);
      return;
    }
    router.push("/econsult/message");
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
          fieldRef={(node) => void fieldRefs.current.set(question.id, node)}
        />
      ))}
    </ScreenScaffold>
  );
}
