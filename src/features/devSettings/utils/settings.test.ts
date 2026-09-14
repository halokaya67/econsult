import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { DEFAULT_DEV_SETTINGS, DEFAULT_PRACTICE_ID } from "./settings";

describe("DEFAULT_DEV_SETTINGS", () => {
  test("starts on a fixture practice with the built-in latency, no faults and the link up", () => {
    expect(FIXTURE_PRACTICE_IDS).toContain(DEFAULT_PRACTICE_ID);
    expect(DEFAULT_DEV_SETTINGS).toEqual({
      practiceId: DEFAULT_PRACTICE_ID,
      latencyMs: null,
      faults: {},
      forceOffline: false,
    });
  });
});
