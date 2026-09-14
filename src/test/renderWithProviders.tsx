import { QueryClient } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import { useState, type ReactElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DEFAULT_PRACTICE_ID } from "@/api/fake/fixtures";
import { AppProviders } from "@/providers/AppProviders";
import { type DevSettings } from "@/providers/DevSettingsProvider";

export type ProviderOptions = { settings?: Partial<DevSettings>; client?: QueryClient };

const METRICS = {
  insets: { top: 59, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 393, height: 852 },
};

export function testSettings(overrides: Partial<DevSettings> = {}): DevSettings {
  return {
    practiceId: DEFAULT_PRACTICE_ID,
    latencyMs: 0,
    faults: {},
    forceOffline: false,
    ...overrides,
  };
}

// gcTime 0: the default five-minute garbage-collection timers for queries and mutations outlive the
// test and hold jest open.
function testClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
}

// The app's own provider stack with the test's overrides, so a test can never pass against wiring
// the app does not have.
export function TestProviders({
  children,
  settings,
  client,
}: ProviderOptions & { children: ReactNode }) {
  const [fallback] = useState(testClient);
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppProviders queryClient={client ?? fallback} initialSettings={testSettings(settings)}>
        {children}
      </AppProviders>
    </SafeAreaProvider>
  );
}

export function hookWrapper(options: ProviderOptions = {}) {
  return function ProviderWrapper({ children }: { children: ReactNode }) {
    return <TestProviders {...options}>{children}</TestProviders>;
  };
}

export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}): RenderResult {
  return render(ui, { wrapper: hookWrapper(options) });
}
