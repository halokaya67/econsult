import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PatientSession } from "@/api/contracts";
import {
  createFakeTransport,
  FAULT_KINDS,
  REQUEST_NAMES,
  type FaultKind,
  type Faults,
  type RequestName,
} from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { createServices, type Services } from "@/api/services";

export type DevSettings = {
  practiceId: string;
  latencyMs: number | null;
  faults: Faults;
  forceOffline: boolean;
};

export type RawEnvSeeds = { practiceId?: string; latencyMs?: string; faults?: string };

export const DEFAULT_PRACTICE_ID = "prc-0421";

// The session would come from authentication; the brief says to fake it and keep it switchable.
const PATIENT = { patientId: "pat-0001", displayName: "Ria de Boer" };

export function parseLatency(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isRequestName(value: string | undefined): value is RequestName {
  return REQUEST_NAMES.some((name) => name === value);
}

function isFaultKind(value: string | undefined): value is FaultKind {
  return FAULT_KINDS.some((kind) => kind === value);
}

export function parseFaults(value: string | undefined): Faults {
  if (!value) return {};
  return value.split(",").reduce<Faults>((faults, pair) => {
    const [name, kind] = pair.split(":").map((part) => part.trim());
    if (!isRequestName(name) || !isFaultKind(kind)) return faults;
    return { ...faults, [name]: kind };
  }, {});
}

export function parsePracticeId(value: string | undefined): string {
  const isFixture = FIXTURE_PRACTICE_IDS.some((id) => id === value);
  return value !== undefined && isFixture ? value : DEFAULT_PRACTICE_ID;
}

export function readEnvSeeds(raw: RawEnvSeeds): DevSettings {
  return {
    practiceId: parsePracticeId(raw.practiceId),
    latencyMs: parseLatency(raw.latencyMs),
    faults: parseFaults(raw.faults),
    forceOffline: false,
  };
}

// EXPO_PUBLIC_* values are inlined at build time and must be referenced with dot notation.
function seedsFromEnv(): DevSettings {
  return readEnvSeeds({
    practiceId: process.env.EXPO_PUBLIC_PRACTICE_ID,
    latencyMs: process.env.EXPO_PUBLIC_LATENCY_MS,
    faults: process.env.EXPO_PUBLIC_FAULTS,
  });
}

type DevSettingsContextValue = { settings: DevSettings; apply: (next: DevSettings) => void };

const DevSettingsContext = createContext<DevSettingsContextValue | null>(null);
const ServicesContext = createContext<Services | null>(null);

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
  const services = useMemo(
    () =>
      createServices(
        createFakeTransport({ latencyMs: settings.latencyMs, faults: settings.faults }),
      ),
    [settings.latencyMs, settings.faults],
  );

  return (
    <DevSettingsContext.Provider value={value}>
      <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
    </DevSettingsContext.Provider>
  );
}

function requireContext<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} must be used inside DevSettingsProvider`);
  return value;
}

export function useDevSettings(): DevSettingsContextValue {
  return requireContext(useContext(DevSettingsContext), "useDevSettings");
}

export function useServices(): Services {
  return requireContext(useContext(ServicesContext), "useServices");
}

export function useSession(): PatientSession {
  const { settings } = useDevSettings();
  return useMemo(() => ({ ...PATIENT, practiceId: settings.practiceId }), [settings.practiceId]);
}
