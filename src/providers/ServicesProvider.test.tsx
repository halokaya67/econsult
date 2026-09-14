import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { DevSettingsProvider, type DevSettings } from "./DevSettingsProvider";
import { ServicesProvider, useServices } from "./ServicesProvider";

const SETTINGS: DevSettings = {
  practiceId: "prc-0873",
  latencyMs: 0,
  faults: {},
  forceOffline: false,
};

function wrapperWith(settings: DevSettings) {
  return function ServicesWrapper({ children }: { children: ReactNode }) {
    return (
      <DevSettingsProvider initial={settings}>
        <ServicesProvider>{children}</ServicesProvider>
      </DevSettingsProvider>
    );
  };
}

describe("ServicesProvider", () => {
  test("provides services backed by the fake transport", async () => {
    const { result } = renderHook(() => useServices(), { wrapper: wrapperWith(SETTINGS) });

    await expect(result.current.getPracticeConfig("prc-0873")).resolves.toMatchObject({
      practiceId: "prc-0873",
    });
  });

  test("builds the transport from the developer settings", async () => {
    const { result } = renderHook(() => useServices(), {
      wrapper: wrapperWith({ ...SETTINGS, faults: { config: "server" } }),
    });

    await expect(result.current.getPracticeConfig("prc-0873")).rejects.toMatchObject({
      kind: "server",
    });
  });

  test("useServices throws outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useServices())).toThrow(/ServicesProvider/);

    silence.mockRestore();
  });
});
