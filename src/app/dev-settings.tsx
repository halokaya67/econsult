import { useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import {
  REQUEST_NAMES,
  type FaultKind,
  type Faults,
  type RequestName,
} from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { DEFAULT_PRACTICE_ID, useDevSettings, type DevSettings } from "@/lib/devSettings";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { text } from "@/theme/text";
import { HEADER_BUTTON_MAX_FONT_SCALE, MIN_TOUCH, spacing } from "@/theme/tokens";

const LATENCY_OPTIONS = ["Default", "None", "Slow (5 seconds)"] as const;
const FAULT_OPTIONS = ["None", "Network", "Server", "Timeout"] as const;
const SLOW_LATENCY_MS = 5000;

type LatencyOption = (typeof LATENCY_OPTIONS)[number];
type FaultOption = (typeof FAULT_OPTIONS)[number];

const PRACTICE_LABELS: Record<string, string> = {
  "prc-0421": "prc-0421: three recipients, two questions",
  "prc-0873": "prc-0873: two recipients, no questions",
  "prc-0000": "prc-0000: no recipients, no questions",
};

const REQUEST_LABELS: Record<RequestName, string> = {
  config: "Practice config",
  careTeam: "Care team",
  create: "Create message",
  upload: "Upload photo",
};

// Keyed by string because ChoiceGroup reports the chosen label as a plain string.
const LATENCY_BY_OPTION: Record<string, number | null> = {
  Default: null,
  None: 0,
  "Slow (5 seconds)": SLOW_LATENCY_MS,
};
const FAULT_BY_OPTION: Record<string, FaultKind | undefined> = {
  None: undefined,
  Network: "network",
  Server: "server",
  Timeout: "timeout",
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

export function latencyFor(option: string): number | null {
  return LATENCY_BY_OPTION[option] ?? null;
}

export function faultOptionFor(kind: FaultKind | undefined): FaultOption {
  return FAULT_OPTIONS.find((option) => FAULT_BY_OPTION[option] === kind) ?? "None";
}

export function faultFor(option: string): FaultKind | undefined {
  return FAULT_BY_OPTION[option];
}

export function withFault(faults: Faults, name: RequestName, kind: FaultKind | undefined): Faults {
  const { [name]: _removed, ...rest } = faults;
  return kind ? { ...rest, [name]: kind } : rest;
}

// The whole row toggles, so the target is 48 points tall even though the native switch is smaller.
function OfflineToggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Force offline"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <Text style={[text.body, styles.rowLabel]}>Force offline</Text>
      {/* iOS Switch composes alignSelf: "flex-start", which would beat the row's alignItems. */}
      <Switch
        value={value}
        onValueChange={onChange}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.switch}
        testID="force-offline-switch"
      />
    </Pressable>
  );
}

// The modal's only other exit applies the draft, so Cancel is the way out that keeps the settings.
function CancelButton({ onPress }: { onPress: () => void }) {
  return (
    <TextButton
      label="Cancel"
      onPress={onPress}
      maxFontSizeMultiplier={HEADER_BUTTON_MAX_FONT_SCALE}
    />
  );
}

function FaultGroups({ faults, onChange }: { faults: Faults; onChange: (next: Faults) => void }) {
  return (
    <>
      {REQUEST_NAMES.map((name) => (
        <ChoiceGroup
          key={name}
          label={`Fail: ${REQUEST_LABELS[name]}`}
          options={FAULT_OPTIONS}
          value={faultOptionFor(faults[name])}
          onChange={(option) => onChange(withFault(faults, name, faultFor(option)))}
        />
      ))}
    </>
  );
}

export default function DevSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings, apply } = useDevSettings();
  const [next, setNext] = useState<DevSettings>(settings);

  if (!isDevelopmentBuild()) return <Redirect href="/" />;

  // Applying clears the cache so the next entry into the flow fetches fresh for the chosen practice.
  function onApply() {
    apply(next);
    queryClient.clear();
    router.dismissTo("/");
  }

  return (
    <>
      <Stack.Screen
        options={{ headerLeft: () => <CancelButton onPress={() => router.back()} /> }}
      />
      <ScreenScaffold action={<PrimaryButton label="Apply and go home" onPress={onApply} />}>
        <Text accessibilityRole="header" style={text.title}>
          Developer settings
        </Text>
        <Text style={text.body}>
          Development builds only. Applying clears cached practice data and returns home.
        </Text>
        <ChoiceGroup
          label="Practice"
          options={FIXTURE_PRACTICE_IDS.map(practiceLabelFor)}
          value={practiceLabelFor(next.practiceId)}
          onChange={(label) => setNext({ ...next, practiceId: practiceIdFor(label) })}
        />
        <ChoiceGroup
          label="Latency"
          options={LATENCY_OPTIONS}
          value={latencyOptionFor(next.latencyMs)}
          onChange={(option) => setNext({ ...next, latencyMs: latencyFor(option) })}
        />
        <FaultGroups faults={next.faults} onChange={(faults) => setNext({ ...next, faults })} />
        <OfflineToggle
          value={next.forceOffline}
          onChange={(forceOffline) => setNext({ ...next, forceOffline })}
        />
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  // flex: 1 so the label wraps instead of pushing the switch off the screen at large text sizes.
  rowLabel: { flex: 1 },
  switch: { alignSelf: "center" },
});
