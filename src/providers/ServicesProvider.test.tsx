import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { DevSettingsProvider, useDevSettings, type DevSettings } from "./DevSettingsProvider";
import { ServicesProvider, useServices } from "./ServicesProvider";

const SETTINGS: DevSettings = {
  practiceId: "prc-0873",
  latencyMs: 0,
  faults: {},
  forceOffline: false,
};
const REQUEST = {
  patientId: "pat-1",
  recipientId: "ct-44",
  body: "A question for the practice",
  answers: [],
};
const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

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

  test("an e-consult the patient already sent survives a developer-settings change", async () => {
    const { result } = renderHook(() => ({ services: useServices(), dev: useDevSettings() }), {
      wrapper: wrapperWith({ ...SETTINGS, faults: { upload: "server" } }),
    });
    const { econsultId } = await result.current.services.createEConsult(REQUEST, "idem-1");
    await expect(result.current.services.uploadAttachment(econsultId, PHOTO)).rejects.toMatchObject(
      { kind: "server" },
    );

    act(() => result.current.dev.apply(SETTINGS));

    await expect(
      result.current.services.uploadAttachment(econsultId, PHOTO),
    ).resolves.toMatchObject({ attachmentId: expect.stringMatching(/^att-/) });
  });

  test("useServices throws outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useServices())).toThrow(/ServicesProvider/);

    silence.mockRestore();
  });
});
