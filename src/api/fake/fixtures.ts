// Wire-shaped data, typed as unknown on purpose: the services parse it exactly as they would a
// real response, so the fixtures exercise the schemas instead of bypassing them.
export const FIXTURE_PRACTICE_IDS = ["prc-0421", "prc-0873", "prc-0000"] as const;

export type FixturePracticeId = (typeof FIXTURE_PRACTICE_IDS)[number];

export const rawPractices: Record<string, unknown> = {
  "prc-0421": {
    practiceId: "prc-0421",
    recipientIds: ["ct-11", "ct-12", "ct-19"],
    questions: [
      {
        id: "q-duration",
        label: "How long have you had this problem?",
        type: "choice",
        options: ["Less than a week", "1 to 4 weeks", "Longer than a month"],
        required: true,
      },
      {
        id: "q-medication",
        label: "Are you already taking anything for it?",
        type: "text",
        required: false,
      },
    ],
  },
  "prc-0873": {
    practiceId: "prc-0873",
    recipientIds: ["ct-44", "ct-45"],
    questions: [],
  },
  "prc-0000": {
    practiceId: "prc-0000",
    recipientIds: [],
    questions: [],
  },
};

// ct-20 is in the care team but not in recipientIds, so the "not listed, not shown" rule has data.
export const rawCareTeams: Record<string, unknown> = {
  "prc-0421": [
    { id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" },
    { id: "ct-12", displayName: "M. Bakker", role: "nurse" },
    { id: "ct-19", displayName: "S. Jansen", role: "assistant" },
    { id: "ct-20", displayName: "Dr. P. Mulder", role: "gp" },
  ],
  "prc-0873": [
    { id: "ct-44", displayName: "Dr. A. Visser", role: "gp" },
    { id: "ct-45", displayName: "L. Smit", role: "nurse" },
  ],
  "prc-0000": [],
};
