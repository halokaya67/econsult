import { Stack } from "expo-router";
import { DraftProvider } from "@/features/econsult/DraftProvider";

// A deep link or reload into a later step still gets a back arrow to the first step.
export const unstable_settings = { anchor: "recipient" };

export default function EConsultLayout() {
  return (
    <DraftProvider>
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="recipient" options={{ title: "Recipient" }} />
        <Stack.Screen name="questions" options={{ title: "Questions" }} />
        <Stack.Screen name="message" options={{ title: "Message" }} />
        <Stack.Screen
          name="sent"
          options={{ title: "Sent", headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </DraftProvider>
  );
}
