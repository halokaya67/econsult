import { stepAfterRecipient, STEP_TITLES, stepCount, stepNumber } from "./steps";

describe("steps", () => {
  test("a practice with questions has three steps", () => {
    expect(stepCount(true)).toBe(3);
    expect(stepNumber("recipient", true)).toBe(1);
    expect(stepNumber("questions", true)).toBe(2);
    expect(stepNumber("message", true)).toBe(3);
  });

  test("a practice without questions has two steps and the message is step two", () => {
    expect(stepCount(false)).toBe(2);
    expect(stepNumber("recipient", false)).toBe(1);
    expect(stepNumber("message", false)).toBe(2);
  });

  test("after the recipient the flow goes to questions only when there are some", () => {
    expect(stepAfterRecipient(true)).toBe("questions");
    expect(stepAfterRecipient(false)).toBe("message");
  });

  test("every step has a patient-facing title", () => {
    expect(STEP_TITLES.recipient).toBe("Who are you writing to?");
    expect(STEP_TITLES.questions).toBe("A few questions from your practice");
    expect(STEP_TITLES.message).toBe("Your message");
  });
});
