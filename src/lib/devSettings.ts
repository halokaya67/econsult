import {
  FAULT_KINDS,
  REQUEST_NAMES,
  type FaultKind,
  type Faults,
  type RequestName,
} from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";

export type DevSettings = {
  practiceId: string;
  latencyMs: number | null;
  faults: Faults;
  forceOffline: boolean;
};

export type RawEnvSeeds = { practiceId?: string; latencyMs?: string; faults?: string };

// Derived from the fixtures so the default is always a practice the validator below accepts.
export const DEFAULT_PRACTICE_ID: string = FIXTURE_PRACTICE_IDS[0];

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
export function seedsFromEnv(): DevSettings {
  return readEnvSeeds({
    practiceId: process.env.EXPO_PUBLIC_PRACTICE_ID,
    latencyMs: process.env.EXPO_PUBLIC_LATENCY_MS,
    faults: process.env.EXPO_PUBLIC_FAULTS,
  });
}
