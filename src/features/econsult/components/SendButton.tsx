import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useScrollToField } from "@/components/ScreenScaffold/ScreenScaffold";
import { OFFLINE_HINT } from "@/lib/copy";
import { text } from "@/theme/text";
import { spacing } from "@/theme/tokens";
import type { SendState } from "../hooks/useMessageSend";

type Props = { send: SendState; isOffline: boolean; isPreparing: boolean };

export const PREPARING_HINT = "Wait for the photo to finish preparing";

function sendHint(isOffline: boolean, isPreparing: boolean): string | undefined {
  if (isOffline) return OFFLINE_HINT;
  return isPreparing ? PREPARING_HINT : undefined;
}

// Rendered inside the scaffold, so unlike the screen itself it can reach the scroll view. At the
// largest text size the offline banner is a screen above Send, so the reason is repeated here.
export function SendButton({ send, isOffline, isPreparing }: Props) {
  const scrollToField = useScrollToField();
  return (
    <View style={styles.send}>
      <PrimaryButton
        label="Send"
        busyLabel="Sending"
        busy={send.submit.isPending}
        disabled={isOffline || isPreparing}
        accessibilityHint={sendHint(isOffline, isPreparing)}
        onPress={() => void send.onSend(scrollToField)}
      />
      {/* Visible copy only: the provider announces going offline and the button speaks it as its
          hint, so a live region here would be the third time. */}
      {isOffline ? <Text style={text.status}>{OFFLINE_HINT}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  send: { gap: spacing.sm },
});
