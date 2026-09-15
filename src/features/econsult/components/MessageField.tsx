import { useEffect } from "react";
import { Text } from "react-native";
import { useIsRelayout } from "@/components/ScreenScaffold/ScreenScaffold";
import { TextField } from "@/components/TextField";
import { announce } from "@/lib/announce";
import { text } from "@/theme/text";
import type { SendState } from "../hooks/useMessageSend";
import { isMessageThin } from "../utils/validation";

type Props = { send: SendState; message: string };

export const FIELD_LABEL = "What would you like to ask?";
export const FIELD_HINT =
  "What helps your GP: where it is, since when, and what you have already tried.";
export const THIN_NUDGE =
  "A little more detail helps your GP answer without asking back, for example where it is and since when.";

// The two wrappers look redundant but are not: reading a ref setter during render trips the
// compiler's react-hooks/refs rule, so the node is handed over from inside the callback instead.
export function MessageField({ send, message }: Props) {
  const isThin = isMessageThin(message);
  const isRelayout = useIsRelayout();
  // Spoken once when the nudge appears; a live region would be Android-only. A text-size change
  // remounts the field with the nudge already on screen, which is not it appearing.
  useEffect(() => {
    if (isThin && !isRelayout()) announce(THIN_NUDGE);
  }, [isRelayout, isThin]);
  return (
    <>
      <TextField
        containerRef={(node) => send.field.setAnchor(node)}
        ref={(node) => send.field.setFocus(node)}
        label={FIELD_LABEL}
        hint={FIELD_HINT}
        value={message}
        onChangeText={send.onMessageChange}
        error={send.field.error}
        editable={!send.submit.isPending}
        multiline
      />
      {isThin ? <Text style={text.muted}>{THIN_NUDGE}</Text> : null}
    </>
  );
}
