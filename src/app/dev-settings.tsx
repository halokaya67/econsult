import { useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import { REQUEST_NAMES, type Faults } from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import {
  FAULT_OPTIONS,
  faultFor,
  faultOptionFor,
  LATENCY_OPTIONS,
  latencyFor,
  latencyOptionFor,
  practiceIdFor,
  practiceLabelFor,
  REQUEST_LABELS,
  withFault,
} from "@/features/devSettings/options";
import type { DevSettings } from "@/lib/devSettings";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { useDevSettings } from "@/providers/DevSettingsProvider";
import { text } from "@/theme/text";
import { HEADER_BUTTON_MAX_FONT_SCALE, MIN_TOUCH, spacing } from "@/theme/tokens";

const TITLE = "Developer settings";
const INTRO = "Development mode only. Applying clears cached practice data and returns home.";
const PRACTICE_OPTIONS = FIXTURE_PRACTICE_IDS.map(practiceLabelFor);

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
          {TITLE}
        </Text>
        <Text style={text.body}>{INTRO}</Text>
        <ChoiceGroup
          label="Practice"
          options={PRACTICE_OPTIONS}
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
