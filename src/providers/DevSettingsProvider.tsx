import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { seedsFromEnv, type DevSettings } from "@/features/devSettings/utils/settings";

type DevSettingsContextValue = { settings: DevSettings; apply: (next: DevSettings) => void };

const DevSettingsContext = createContext<DevSettingsContextValue | null>(null);

// The runtime store for the developer settings; the environment only seeds its first value.
export function DevSettingsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: DevSettings;
}) {
  const [settings, setSettings] = useState<DevSettings>(() => initial ?? seedsFromEnv());
  const apply = useCallback((next: DevSettings) => setSettings(next), []);
  const value = useMemo(() => ({ settings, apply }), [settings, apply]);

  return <DevSettingsContext.Provider value={value}>{children}</DevSettingsContext.Provider>;
}

export function useDevSettings(): DevSettingsContextValue {
  const value = useContext(DevSettingsContext);
  if (value === null) throw new Error("useDevSettings must be used inside DevSettingsProvider");
  return value;
}
