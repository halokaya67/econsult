import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import { useState, type ReactElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DevSettingsProvider, type DevSettings } from "@/lib/devSettings";
import { NetworkProvider } from "@/lib/network";

export type ProviderOptions = { settings?: Partial<DevSettings>; client?: QueryClient };

const METRICS = {
  insets: { top: 59, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 393, height: 852 },
};

export function testSettings(overrides: Partial<DevSettings> = {}): DevSettings {
  return { practiceId: "prc-0421", latencyMs: 0, faults: {}, forceOffline: false, ...overrides };
}

function testClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function TestProviders({
  children,
  settings,
  client,
}: ProviderOptions & { children: ReactNode }) {
  const devSettings = testSettings(settings);
  const [fallback] = useState(testClient);
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <DevSettingsProvider initial={devSettings}>
        <QueryClientProvider client={client ?? fallback}>
          <NetworkProvider forceOffline={devSettings.forceOffline}>{children}</NetworkProvider>
        </QueryClientProvider>
      </DevSettingsProvider>
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
