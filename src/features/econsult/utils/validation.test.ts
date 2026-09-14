import type { Question } from "@/api/contracts";
import {
  EMPTY_MESSAGE_ERROR,
  isMessageThin,
  REQUIRED_ERROR,
  validateAnswers,
  validateMessage,
} from "./validation";

const QUESTIONS: Question[] = [
  { id: "q-duration", label: "How long?", type: "choice", options: ["A", "B"], required: true },
  { id: "q-medication", label: "Taking anything?", type: "text", required: false },
];

describe("validateAnswers", () => {
  test("flags a required question that has no answer", () => {
    expect(validateAnswers(QUESTIONS, {})).toEqual({ "q-duration": REQUIRED_ERROR });
  });

  test("treats a whitespace-only answer as missing", () => {
    expect(validateAnswers(QUESTIONS, { "q-duration": "   " })).toEqual({
      "q-duration": REQUIRED_ERROR,
    });
  });

  test("passes when every required question is answered", () => {
    expect(validateAnswers(QUESTIONS, { "q-duration": "A" })).toEqual({});
  });

  test("never flags an optional question", () => {
    expect(validateAnswers([QUESTIONS[1]], {})).toEqual({});
  });
});

describe("validateMessage", () => {
  test("rejects an empty or whitespace-only message", () => {
    expect(validateMessage("")).toBe(EMPTY_MESSAGE_ERROR);
    expect(validateMessage("  \n ")).toBe(EMPTY_MESSAGE_ERROR);
  });

  test("accepts any non-empty message", () => {
    expect(validateMessage("My knee hurts")).toBeNull();
  });
});

describe("isMessageThin", () => {
  test("is true for a short non-empty message and false for an empty or long one", () => {
    expect(isMessageThin("my knee hurts")).toBe(true);
    expect(isMessageThin("")).toBe(false);
    expect(isMessageThin("My left knee has hurt for two weeks after a fall")).toBe(false);
  });
});
