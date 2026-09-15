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
import { CancelHeaderButton } from "@/components/CancelHeaderButton";
import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold/ScreenScaffold";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { useDevSettings, type DevSettings } from "@/providers/DevSettingsProvider";
import { text } from "@/theme/text";
import { MIN_TOUCH, spacing } from "@/theme/tokens";

const TITLE = "Developer settings";
const INTRO = "Development mode only. Applying clears cached practice data and returns home.";

// Keyed by id, so a practice the fixtures gain stops compiling here instead of reaching the screen
// with no description of what it is for.
const PRACTICE_DESCRIPTIONS: Record<(typeof FIXTURE_PRACTICE_IDS)[number], string> = {
  "prc-0421": "three recipients, two questions",
  "prc-0873": "two recipients, no questions",
  "prc-0000": "no recipients, no questions",
};

const PRACTICE_OPTIONS: Choice<string>[] = FIXTURE_PRACTICE_IDS.map((practiceId) => ({
  label: `${practiceId}: ${PRACTICE_DESCRIPTIONS[practiceId]}`,
  value: practiceId,
}));

const LATENCY_OPTIONS: Choice<number | null>[] = [
  { label: "Default", value: null },
  { label: "None", value: 0 },
  { label: "Slow (5 seconds)", value: 5000 },
];

const FAULT_OPTIONS: Choice<FaultKind | undefined>[] = [
  { label: "None", value: undefined },
  { label: "Network", value: "network" },
  { label: "Server", value: "server" },
  { label: "Timeout", value: "timeout" },
];

const REQUEST_LABELS: Record<RequestName, string> = {
  config: "Practice config",
  careTeam: "Care team",
  create: "Create message",
  upload: "Upload photo",
};

// A request with no fault loses its key rather than keeping an undefined one, so the settings read
// the same as the ones the app started with.
function faultsWith(faults: Faults, name: RequestName, kind: FaultKind | undefined): Faults {
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

function FaultGroups({ faults, onChange }: { faults: Faults; onChange: (next: Faults) => void }) {
  return (
    <>
      {REQUEST_NAMES.map((name) => (
        <ChoiceGroup
          key={name}
          label={`Fail: ${REQUEST_LABELS[name]}`}
          options={FAULT_OPTIONS}
          value={faults[name]}
          onChange={(kind) => onChange(faultsWith(faults, name, kind))}
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
      {/* The modal's only other exit applies the draft, so Cancel is the way out that keeps them. */}
      <Stack.Screen
        options={{ headerLeft: () => <CancelHeaderButton onPress={() => router.back()} /> }}
      />
      <ScreenScaffold action={<PrimaryButton label="Apply and go home" onPress={onApply} />}>
        <Text accessibilityRole="header" style={text.title}>
          {TITLE}
        </Text>
        <Text style={text.body}>{INTRO}</Text>
        <ChoiceGroup
          label="Practice"
          options={PRACTICE_OPTIONS}
          value={next.practiceId}
          onChange={(practiceId) => setNext({ ...next, practiceId })}
        />
        <ChoiceGroup
          label="Latency"
          options={LATENCY_OPTIONS}
          value={next.latencyMs}
          onChange={(latencyMs) => setNext({ ...next, latencyMs })}
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
