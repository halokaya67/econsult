import { useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { shouldGuardLeaving, type DraftState } from "../state/draft";

const DISCARD_TITLE = "Discard your message?";
const DISCARD_BODY = "What you have entered so far will be lost.";

// Leaving step 1 in any direction means leaving the flow, so Discard lowers the guard and goes home
// instead of replaying the blocked action: a root-level pop re-dispatched here is a no-op on device.
export function useDiscardGuard(draft: DraftState): void {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  usePreventRemove(shouldGuardLeaving(draft) && !isLeaving, () => {
    Alert.alert(DISCARD_TITLE, DISCARD_BODY, [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => setIsLeaving(true) },
    ]);
  });

  useEffect(() => {
    if (isLeaving) router.dismissTo("/");
  }, [isLeaving, router]);
}
