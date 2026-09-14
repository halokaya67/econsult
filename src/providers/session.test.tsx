import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { DevSettings } from "@/features/devSettings/utils/settings";
import { DevSettingsProvider } from "./DevSettingsProvider";
import { useSession } from "./session";

const SETTINGS: DevSettings = {
  practiceId: "prc-0873",
  latencyMs: 0,
  faults: {},
  forceOffline: false,
};

function SettingsWrapper({ children }: { children: ReactNode }) {
  return <DevSettingsProvider initial={SETTINGS}>{children}</DevSettingsProvider>;
}

describe("useSession", () => {
  test("follows the selected practice", () => {
    const { result } = renderHook(() => useSession(), { wrapper: SettingsWrapper });

    expect(result.current).toEqual({
      patientId: expect.any(String),
      practiceId: "prc-0873",
      displayName: expect.any(String),
    });
  });
});
