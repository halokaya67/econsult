import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import {
  DEFAULT_PRACTICE_ID,
  parseFaults,
  parseLatency,
  parsePracticeId,
  readEnvSeeds,
  seedsFromEnv,
} from "./settings";

describe("parseLatency", () => {
  test.each([
    [undefined, null],
    ["", null],
    ["  ", null],
    ["abc", null],
    ["-5", null],
    ["2500", 2500],
    ["0", 0],
  ])("%s -> %s", (input, expected) => {
    expect(parseLatency(input)).toBe(expected);
  });
});

describe("parseFaults", () => {
  test("parses request:kind pairs and ignores junk", () => {
    expect(parseFaults("config:timeout, upload:server,bogus:network,create:nope")).toEqual({
      config: "timeout",
      upload: "server",
    });
  });

  test("returns no faults for an empty value", () => {
    expect(parseFaults(undefined)).toEqual({});
    expect(parseFaults("")).toEqual({});
  });
});

describe("parsePracticeId", () => {
  test("keeps a fixture practice and falls back otherwise", () => {
    expect(parsePracticeId("prc-0873")).toBe("prc-0873");
    expect(parsePracticeId("prc-9999")).toBe(DEFAULT_PRACTICE_ID);
    expect(parsePracticeId(undefined)).toBe(DEFAULT_PRACTICE_ID);
  });
});

describe("readEnvSeeds", () => {
  test("combines the parsers and starts online", () => {
    expect(
      readEnvSeeds({ practiceId: "prc-0000", latencyMs: "10", faults: "create:network" }),
    ).toEqual({
      practiceId: "prc-0000",
      latencyMs: 10,
      faults: { create: "network" },
      forceOffline: false,
    });
  });
});

describe("seedsFromEnv", () => {
  // Asserted against the fixtures rather than fixed values: the seeds come from whatever .env the
  // clone has.
  test("reads the environment into settings the app can start with", () => {
    const seeds = seedsFromEnv();

    expect(FIXTURE_PRACTICE_IDS).toContain(seeds.practiceId);
    expect(seeds.forceOffline).toBe(false);
  });
});
