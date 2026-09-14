import { Stack } from "expo-router";
import { useState } from "react";
import { AppProviders } from "@/providers/AppProviders";
import { createQueryClient } from "@/providers/queryClient";

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <AppProviders queryClient={queryClient}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="index" options={{ title: "Your practice" }} />
        <Stack.Screen name="econsult" options={{ headerShown: false }} />
        <Stack.Screen
          name="dev-settings"
          options={{ title: "Developer settings", presentation: "modal" }}
        />
      </Stack>
    </AppProviders>
  );
}
