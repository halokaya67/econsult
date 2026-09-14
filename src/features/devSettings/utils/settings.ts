import { type Faults } from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";

export type DevSettings = {
  practiceId: string;
  latencyMs: number | null;
  faults: Faults;
  forceOffline: boolean;
};

// Derived from the fixtures so the default is always a practice the app has data for.
export const DEFAULT_PRACTICE_ID: string = FIXTURE_PRACTICE_IDS[0];

// The single source for the state the app starts with; developer settings change it at runtime.
export const DEFAULT_DEV_SETTINGS: DevSettings = {
  practiceId: DEFAULT_PRACTICE_ID,
  latencyMs: null,
  faults: {},
  forceOffline: false,
};
