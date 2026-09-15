import {
  careTeamMemberSchema,
  createEConsultRequestSchema,
  IDEMPOTENCY_HEADER,
  practiceConfigSchema,
  questionSchema,
} from "./contracts";

describe("questionSchema", () => {
  test("rejects a question that is not an object or has no type", () => {
    expect(questionSchema.safeParse("q-duration").success).toBe(false);
    expect(questionSchema.safeParse({ id: "q1", label: "x", required: true }).success).toBe(false);
  });

  test("keeps a choice question with at least two options", () => {
    const result = questionSchema.parse({
      id: "q-duration",
      label: "How long?",
      type: "choice",
      options: ["A", "B"],
      required: true,
    });

    expect(result).toEqual({
      id: "q-duration",
      label: "How long?",
      type: "choice",
      options: ["A", "B"],
      required: true,
    });
  });

  test("rejects a choice question with fewer than two options", () => {
    const result = questionSchema.safeParse({
      id: "q1",
      label: "Pick",
      type: "choice",
      options: ["Only"],
      required: true,
    });

    expect(result.success).toBe(false);
  });

  test("a question the app cannot render is left out and the rest of the form stays", () => {
    const result = practiceConfigSchema.parse({
      practiceId: "prc-1",
      recipientIds: ["ct-1"],
      questions: [
        { id: "q-date", label: "When?", type: "date", required: false },
        { id: "q-none", label: "Untyped", required: true },
        { id: "q-one", label: "Pick", type: "choice", options: ["only"], required: true },
        { id: "q-text", label: "Where?", type: "text", required: true },
      ],
    });

    expect(result.questions).toEqual([
      { id: "q-text", label: "Where?", type: "text", required: true },
    ]);
  });

  test("a questions field that is not a list still fails the config", () => {
    const result = practiceConfigSchema.safeParse({
      practiceId: "prc-1",
      recipientIds: [],
      questions: "none",
    });

    expect(result.success).toBe(false);
  });

  test("rejects a question without an id", () => {
    const result = questionSchema.safeParse({ label: "x", type: "text", required: true });

    expect(result.success).toBe(false);
  });
});

describe("careTeamMemberSchema", () => {
  test("keeps a known role", () => {
    const result = careTeamMemberSchema.parse({ id: "ct-1", displayName: "Dr. A", role: "gp" });

    expect(result.role).toBe("gp");
  });

  test("coerces an unknown role to other", () => {
    const result = careTeamMemberSchema.parse({ id: "ct-1", displayName: "Dr. A", role: "vet" });

    expect(result.role).toBe("other");
  });
});

describe("practiceConfigSchema", () => {
  test("parses a config with mixed question types", () => {
    const result = practiceConfigSchema.parse({
      practiceId: "prc-1",
      recipientIds: ["ct-1"],
      questions: [
        { id: "q1", label: "A", type: "choice", options: ["x", "y"], required: true },
        { id: "q2", label: "B", type: "text", required: false },
      ],
    });

    expect(result.questions.map((q) => q.type)).toEqual(["choice", "text"]);
  });

  test("rejects a config whose recipientIds is not an array", () => {
    const result = practiceConfigSchema.safeParse({
      practiceId: "p",
      recipientIds: "ct-1",
      questions: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("createEConsultRequestSchema", () => {
  test("rejects an empty body", () => {
    const result = createEConsultRequestSchema.safeParse({
      patientId: "p",
      recipientId: "r",
      body: "",
      answers: [],
    });

    expect(result.success).toBe(false);
  });
});

test("the idempotency header name is part of the contract", () => {
  expect(IDEMPOTENCY_HEADER).toBe("Idempotency-Key");
});
