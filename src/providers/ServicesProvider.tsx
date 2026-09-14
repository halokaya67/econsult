import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createFakeTransport } from "@/api/fake/fakeTransport";
import { createServices, type Services } from "@/api/services";
import { useDevSettings } from "./DevSettingsProvider";

const ServicesContext = createContext<Services | null>(null);

// The one place that chooses the backend: the real client described in DECISIONS.md would be
// constructed here instead of the fake, and nothing above or below this file would change.
export function ServicesProvider({ children }: { children: ReactNode }) {
  const { settings } = useDevSettings();
  const services = useMemo(
    () =>
      createServices(
        createFakeTransport({ latencyMs: settings.latencyMs, faults: settings.faults }),
      ),
    [settings.latencyMs, settings.faults],
  );

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const value = useContext(ServicesContext);
  if (value === null) throw new Error("useServices must be used inside ServicesProvider");
  return value;
}
