import { careTeamMemberSchema, practiceConfigSchema } from "../contracts";
import { DEFAULT_PRACTICE_ID, FIXTURE_PRACTICE_IDS, rawCareTeams, rawPractices } from "./fixtures";

describe("fixtures", () => {
  test("ships exactly the three spec practices", () => {
    expect(FIXTURE_PRACTICE_IDS).toEqual(["prc-0421", "prc-0873", "prc-0000"]);
  });

  test("the default practice is one the fixtures carry data for", () => {
    const result = practiceConfigSchema.safeParse(rawPractices[DEFAULT_PRACTICE_ID]);

    expect(result.success).toBe(true);
  });

  test.each(FIXTURE_PRACTICE_IDS)("practice %s parses as a config", (practiceId) => {
    const result = practiceConfigSchema.safeParse(rawPractices[practiceId]);

    expect(result.success).toBe(true);
  });

  test.each(FIXTURE_PRACTICE_IDS)("care team of %s parses as members", (practiceId) => {
    const result = careTeamMemberSchema.array().safeParse(rawCareTeams[practiceId]);

    expect(result.success).toBe(true);
  });

  test("prc-0421 has one required choice question and one optional text question", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0421"]);

    expect(config.questions.map((q) => [q.type, q.required])).toEqual([
      ["choice", true],
      ["text", false],
    ]);
  });

  test("prc-0873 has recipients but no questions", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0873"]);

    expect(config.recipientIds.length).toBeGreaterThan(0);
    expect(config.questions).toEqual([]);
  });

  test("prc-0000 has no recipients and no questions", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0000"]);

    expect(config.recipientIds).toEqual([]);
    expect(config.questions).toEqual([]);
  });

  test("every recipient id of prc-0421 and prc-0873 exists in its care team", () => {
    for (const practiceId of ["prc-0421", "prc-0873"]) {
      const config = practiceConfigSchema.parse(rawPractices[practiceId]);
      const team = careTeamMemberSchema.array().parse(rawCareTeams[practiceId]);
      const teamIds = team.map((m) => m.id);

      for (const id of config.recipientIds) expect(teamIds).toContain(id);
    }
  });
});
