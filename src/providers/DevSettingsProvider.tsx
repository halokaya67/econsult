import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_DEV_SETTINGS, type DevSettings } from "@/features/devSettings/utils/settings";

type DevSettingsContextValue = { settings: DevSettings; apply: (next: DevSettings) => void };

const DevSettingsContext = createContext<DevSettingsContextValue | null>(null);

// The runtime store for the developer settings; the developer-settings screen is what changes it.
export function DevSettingsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: DevSettings;
}) {
  const [settings, setSettings] = useState<DevSettings>(initial ?? DEFAULT_DEV_SETTINGS);
  const apply = useCallback((next: DevSettings) => setSettings(next), []);
  const value = useMemo(() => ({ settings, apply }), [settings, apply]);

  return <DevSettingsContext.Provider value={value}>{children}</DevSettingsContext.Provider>;
}

export function useDevSettings(): DevSettingsContextValue {
  const value = useContext(DevSettingsContext);
  if (value === null) throw new Error("useDevSettings must be used inside DevSettingsProvider");
  return value;
}
