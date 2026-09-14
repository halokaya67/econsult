import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { DevSettings } from "@/lib/devSettings";
import { NetworkProvider } from "@/lib/network";
import { DevSettingsProvider, useDevSettings } from "./DevSettingsProvider";
import { ServicesProvider } from "./ServicesProvider";

function NetworkFromSettings({ children }: { children: ReactNode }) {
  const { settings } = useDevSettings();
  return <NetworkProvider forceOffline={settings.forceOffline}>{children}</NetworkProvider>;
}

// The one provider stack: the root layout and the test wrapper both mount this, so what the tests
// run is what the app ships.
export function AppProviders({
  queryClient,
  initialSettings,
  children,
}: {
  queryClient: QueryClient;
  initialSettings?: DevSettings;
  children: ReactNode;
}) {
  return (
    <DevSettingsProvider initial={initialSettings}>
      <QueryClientProvider client={queryClient}>
        <NetworkFromSettings>
          <ServicesProvider>{children}</ServicesProvider>
        </NetworkFromSettings>
      </QueryClientProvider>
    </DevSettingsProvider>
  );
}
