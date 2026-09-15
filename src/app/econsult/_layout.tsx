import { Stack, useRouter } from "expo-router";
import { CancelHeaderButton } from "@/components/CancelHeaderButton";
import { DraftProvider } from "@/features/econsult/state/DraftProvider";

// A deep link or reload into a later step still gets a back arrow to the first step.
export const unstable_settings = { anchor: "recipient" };

export default function EConsultLayout() {
  const router = useRouter();
  // Cancel unwinds the flow from any step. Removing step 1 is what its discard guard watches, so a
  // draft with unsent content is asked about first and an empty one leaves at once.
  const cancel = () => router.dismissTo("/");
  const step = (title: string) => ({
    title,
    headerRight: () => <CancelHeaderButton onPress={cancel} />,
  });

  return (
    <DraftProvider>
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="recipient" options={step("Recipient")} />
        <Stack.Screen name="questions" options={step("Questions")} />
        <Stack.Screen name="message" options={step("Message")} />
        <Stack.Screen
          name="sent"
          options={{ title: "Sent", headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </DraftProvider>
  );
}
