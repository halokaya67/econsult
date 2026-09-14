import {
  faultFor,
  faultOptionFor,
  latencyFor,
  latencyOptionFor,
  practiceIdFor,
  practiceLabelFor,
  withFault,
} from "./options";
import { DEFAULT_PRACTICE_ID } from "./settings";

describe("developer settings options", () => {
  test("latency options round-trip", () => {
    expect(latencyFor(latencyOptionFor(null))).toBeNull();
    expect(latencyFor(latencyOptionFor(0))).toBe(0);
    expect(latencyFor(latencyOptionFor(5000))).toBe(5000);
    expect(latencyOptionFor(1234)).toBe("Default");
  });

  test("fault options round-trip", () => {
    expect(faultFor(faultOptionFor(undefined))).toBeUndefined();
    expect(faultFor(faultOptionFor("network"))).toBe("network");
    expect(faultFor(faultOptionFor("server"))).toBe("server");
    expect(faultFor(faultOptionFor("timeout"))).toBe("timeout");
  });

  test("withFault sets and clears one request's fault without mutating", () => {
    const faults = { config: "server" } as const;

    const set = withFault(faults, "upload", "timeout");
    const cleared = withFault(set, "config", undefined);

    expect(set).toEqual({ config: "server", upload: "timeout" });
    expect(cleared).toEqual({ upload: "timeout" });
    expect(faults).toEqual({ config: "server" });
  });

  test("practice labels round-trip and unknown labels fall back to the default practice", () => {
    expect(practiceIdFor(practiceLabelFor("prc-0873"))).toBe("prc-0873");
    expect(practiceIdFor("nonsense")).toBe(DEFAULT_PRACTICE_ID);
  });

  test("a practice without a description is labelled with its own id", () => {
    expect(practiceLabelFor("prc-1234")).toBe("prc-1234");
  });
});
