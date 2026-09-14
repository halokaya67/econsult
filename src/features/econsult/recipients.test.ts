import type { CareTeamMember, PracticeEConsultConfig } from "@/api/contracts";
import {
  joinRecipients,
  recipientNameFor,
  roleLabel,
  UNKNOWN_RECIPIENT,
  type RecipientsResult,
} from "./recipients";

const TEAM: CareTeamMember[] = [
  { id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" },
  { id: "ct-12", displayName: "M. Bakker", role: "nurse" },
  { id: "ct-20", displayName: "Dr. P. Mulder", role: "gp" },
];

function config(recipientIds: string[]): PracticeEConsultConfig {
  return { practiceId: "prc-0421", recipientIds, questions: [] };
}

describe("joinRecipients", () => {
  test("keeps the practice's order and only listed members", () => {
    const result = joinRecipients(config(["ct-12", "ct-11"]), TEAM);

    expect(result.map((r) => r.id)).toEqual(["ct-12", "ct-11"]);
  });

  test("drops a recipient id that is not in the care team and warns in development", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = joinRecipients(config(["ct-11", "ct-99"]), TEAM);

    expect(result.map((r) => r.id)).toEqual(["ct-11"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("ct-99"));
    warn.mockRestore();
  });

  test("returns nothing when the practice lists no recipients", () => {
    expect(joinRecipients(config([]), TEAM)).toEqual([]);
  });
});

describe("roleLabel", () => {
  test.each([
    ["gp", "GP"],
    ["nurse", "Practice nurse"],
    ["assistant", "Practice assistant"],
    ["other", "Care team member"],
  ] as const)("%s -> %s", (role, label) => {
    expect(roleLabel(role)).toBe(label);
  });
});

describe("recipientNameFor", () => {
  const ready: RecipientsResult = { status: "ready", recipients: TEAM, questions: [] };

  test("returns the selected recipient's name once the list is ready", () => {
    expect(recipientNameFor(ready, "ct-12")).toBe("M. Bakker");
  });

  test("falls back for an unknown id or no selection", () => {
    expect(recipientNameFor(ready, "ct-99")).toBe(UNKNOWN_RECIPIENT);
    expect(recipientNameFor(ready, null)).toBe(UNKNOWN_RECIPIENT);
  });

  test("falls back while the list is not ready", () => {
    expect(recipientNameFor({ status: "loading" }, "ct-12")).toBe(UNKNOWN_RECIPIENT);
  });
});
