import type { Question } from "@/api/contracts";

export const MESSAGE_NUDGE_MIN_LENGTH = 20;
export const REQUIRED_ERROR = "This question is required";
export const EMPTY_MESSAGE_ERROR = "Please write your question before sending";

export type AnswerErrors = Readonly<Record<string, string>>;

export function validateAnswers(
  questions: Question[],
  answers: Readonly<Record<string, string>>,
): AnswerErrors {
  return questions.reduce<Record<string, string>>((errors, question) => {
    if (!question.required) return errors;
    const value = answers[question.id]?.trim() ?? "";
    return value.length > 0 ? errors : { ...errors, [question.id]: REQUIRED_ERROR };
  }, {});
}

export function validateMessage(message: string): string | null {
  return message.trim().length > 0 ? null : EMPTY_MESSAGE_ERROR;
}

// A soft nudge, never a block: "my knee hurts" is exactly the message GPs cannot act on.
export function isMessageThin(message: string): boolean {
  const length = message.trim().length;
  return length > 0 && length < MESSAGE_NUDGE_MIN_LENGTH;
}
