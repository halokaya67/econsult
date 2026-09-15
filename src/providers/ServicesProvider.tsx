import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createFakeState, createFakeTransport } from "@/api/fake/fakeTransport";
import { createServices, type Services } from "@/api/services";
import { useDevSettings } from "./DevSettingsProvider";

const ServicesContext = createContext<Services | null>(null);

// The one place that chooses the backend: the real client described in docs/decisions-log.md would be
// constructed here instead of the fake, and nothing above or below this file would change.
export function ServicesProvider({ children }: { children: ReactNode }) {
  const { settings } = useDevSettings();
  // One backend for the app's lifetime: changing latency, faults or the practice rebuilds the
  // transport, and the photo retry still has to reach the e-consult the create already made.
  const [fakeState] = useState(createFakeState);
  const services = useMemo(
    () =>
      createServices(
        createFakeTransport({ latencyMs: settings.latencyMs, faults: settings.faults }, fakeState),
      ),
    [fakeState, settings.latencyMs, settings.faults],
  );

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const value = useContext(ServicesContext);
  if (value === null) throw new Error("useServices must be used inside ServicesProvider");
  return value;
}
