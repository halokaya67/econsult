import { accessibleName, labelWithRequirement } from "./fieldLabel";

describe("labelWithRequirement", () => {
  test("appends the requirement when the field has one", () => {
    expect(labelWithRequirement("Your message", "required")).toBe("Your message (required)");
    expect(labelWithRequirement("Your message", "optional")).toBe("Your message (optional)");
  });

  test("leaves a label without a requirement alone", () => {
    expect(labelWithRequirement("Your message")).toBe("Your message");
  });
});

describe("accessibleName", () => {
  test("folds an error into the name", () => {
    expect(accessibleName("Your message", "Write your question first")).toBe(
      "Your message. Error: Write your question first",
    );
  });

  test("is the label itself when there is no error", () => {
    expect(accessibleName("Your message")).toBe("Your message");
    expect(accessibleName("Your message", null)).toBe("Your message");
  });
});
