import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState, type ReactNode } from "react";
import { DevSettingsProvider, useDevSettings } from "@/lib/devSettings";
import { NetworkProvider } from "@/lib/network";
import { createQueryClient } from "@/lib/queryClient";

function NetworkFromSettings({ children }: { children: ReactNode }) {
  const { settings } = useDevSettings();
  return <NetworkProvider forceOffline={settings.forceOffline}>{children}</NetworkProvider>;
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <DevSettingsProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkFromSettings>
          <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
            <Stack.Screen name="index" options={{ title: "Your practice" }} />
            <Stack.Screen name="econsult" options={{ headerShown: false }} />
            <Stack.Screen
              name="dev-settings"
              options={{ title: "Developer settings", presentation: "modal" }}
            />
          </Stack>
        </NetworkFromSettings>
      </QueryClientProvider>
    </DevSettingsProvider>
  );
}
