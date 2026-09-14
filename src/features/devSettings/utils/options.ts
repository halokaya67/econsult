import {
  FAULT_KINDS,
  type FaultKind,
  type Faults,
  type RequestName,
} from "@/api/fake/fakeTransport";
import { DEFAULT_PRACTICE_ID, FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";

export const LATENCY_OPTIONS = ["Default", "None", "Slow (5 seconds)"] as const;
export const FAULT_OPTIONS = ["None", "Network", "Server", "Timeout"] as const;
const SLOW_LATENCY_MS = 5000;

type LatencyOption = (typeof LATENCY_OPTIONS)[number];
type FaultOption = (typeof FAULT_OPTIONS)[number];

const PRACTICE_LABELS: Record<string, string> = {
  "prc-0421": "prc-0421: three recipients, two questions",
  "prc-0873": "prc-0873: two recipients, no questions",
  "prc-0000": "prc-0000: no recipients, no questions",
};

export const REQUEST_LABELS: Record<RequestName, string> = {
  config: "Practice config",
  careTeam: "Care team",
  create: "Create message",
  upload: "Upload photo",
};

const LATENCY_BY_OPTION: Record<LatencyOption, number | null> = {
  Default: null,
  None: 0,
  "Slow (5 seconds)": SLOW_LATENCY_MS,
};

// Keyed by kind, so a kind the transport gains stops compiling here instead of quietly reading as
// "None" on the screen. The reverse direction is a search rather than a second table.
const OPTION_BY_FAULT: Record<FaultKind, FaultOption> = {
  network: "Network",
  server: "Server",
  timeout: "Timeout",
};

export function practiceLabelFor(practiceId: string): string {
  return PRACTICE_LABELS[practiceId] ?? practiceId;
}

export function practiceIdFor(label: string): string {
  return FIXTURE_PRACTICE_IDS.find((id) => PRACTICE_LABELS[id] === label) ?? DEFAULT_PRACTICE_ID;
}

export function latencyOptionFor(latencyMs: number | null): LatencyOption {
  if (latencyMs === 0) return "None";
  if (latencyMs === SLOW_LATENCY_MS) return "Slow (5 seconds)";
  return "Default";
}

export function latencyFor(option: LatencyOption): number | null {
  return LATENCY_BY_OPTION[option];
}

export function faultOptionFor(kind: FaultKind | undefined): FaultOption {
  return kind === undefined ? "None" : OPTION_BY_FAULT[kind];
}

export function faultFor(option: FaultOption): FaultKind | undefined {
  return FAULT_KINDS.find((kind) => OPTION_BY_FAULT[kind] === option);
}

export function withFault(faults: Faults, name: RequestName, kind: FaultKind | undefined): Faults {
  const { [name]: _removed, ...rest } = faults;
  return kind ? { ...rest, [name]: kind } : rest;
}
