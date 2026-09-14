export type FlowStep = "recipient" | "questions" | "message";

export const STEP_TITLES: Record<FlowStep, string> = {
  recipient: "Who are you writing to?",
  questions: "A few questions from your practice",
  message: "Your message",
};

const STEPS_WITH_QUESTIONS = 3;
const STEPS_WITHOUT_QUESTIONS = 2;

export function stepCount(hasQuestions: boolean): number {
  return hasQuestions ? STEPS_WITH_QUESTIONS : STEPS_WITHOUT_QUESTIONS;
}

export function stepNumber(step: FlowStep, hasQuestions: boolean): number {
  if (step === "recipient") return 1;
  if (step === "questions") return 2;
  return stepCount(hasQuestions);
}

// The feature speaks in steps; the screens own the route each step lives at.
export function stepAfterRecipient(hasQuestions: boolean): Exclude<FlowStep, "recipient"> {
  return hasQuestions ? "questions" : "message";
}
