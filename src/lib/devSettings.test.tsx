import { renderHook, act } from "@testing-library/react-native";
import type { ReactNode } from "react";
import {
  DEFAULT_PRACTICE_ID,
  DevSettingsProvider,
  parseFaults,
  parseLatency,
  parsePracticeId,
  readEnvSeeds,
  useDevSettings,
  useServices,
  useSession,
  type DevSettings,
} from "./devSettings";

const SETTINGS: DevSettings = {
  practiceId: "prc-0873",
  latencyMs: 0,
  faults: {},
  forceOffline: false,
};

function wrapperWith(initial?: DevSettings) {
  return function SettingsWrapper({ children }: { children: ReactNode }) {
    return <DevSettingsProvider initial={initial}>{children}</DevSettingsProvider>;
  };
}

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

describe("DevSettingsProvider", () => {
  test("seeds from the environment when no initial settings are given", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith() });

    expect(result.current.settings.practiceId).toBe(DEFAULT_PRACTICE_ID);
    expect(result.current.settings.forceOffline).toBe(false);
  });

  test("apply replaces the settings", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith(SETTINGS) });

    act(() => result.current.apply({ ...SETTINGS, forceOffline: true }));

    expect(result.current.settings.forceOffline).toBe(true);
  });

  test("useSession follows the selected practice", () => {
    const { result } = renderHook(() => useSession(), { wrapper: wrapperWith(SETTINGS) });

    expect(result.current).toEqual({
      patientId: expect.any(String),
      practiceId: "prc-0873",
      displayName: expect.any(String),
    });
  });

  test("useServices returns services backed by the fake transport", async () => {
    const { result } = renderHook(() => useServices(), { wrapper: wrapperWith(SETTINGS) });

    await expect(result.current.getPracticeConfig("prc-0873")).resolves.toMatchObject({
      practiceId: "prc-0873",
    });
  });

  test("the hooks throw outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useDevSettings())).toThrow(/DevSettingsProvider/);
    expect(() => renderHook(() => useServices())).toThrow(/DevSettingsProvider/);

    silence.mockRestore();
  });
});
