import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { DEFAULT_PRACTICE_ID } from "@/api/fake/fixtures";
import {
  DEFAULT_DEV_SETTINGS,
  DevSettingsProvider,
  useDevSettings,
  type DevSettings,
} from "./DevSettingsProvider";

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

describe("DEFAULT_DEV_SETTINGS", () => {
  test("starts on a fixture practice with the built-in latency, no faults and the link up", () => {
    expect(DEFAULT_DEV_SETTINGS).toEqual({
      practiceId: DEFAULT_PRACTICE_ID,
      latencyMs: null,
      faults: {},
      forceOffline: false,
    });
  });
});

describe("DevSettingsProvider", () => {
  test("starts from the default settings when no initial settings are given", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith() });

    expect(result.current.settings).toEqual(DEFAULT_DEV_SETTINGS);
  });

  test("apply replaces the settings", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith(SETTINGS) });

    act(() => result.current.apply({ ...SETTINGS, forceOffline: true }));

    expect(result.current.settings.forceOffline).toBe(true);
  });

  test("useDevSettings throws outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useDevSettings())).toThrow(/DevSettingsProvider/);

    silence.mockRestore();
  });
});
