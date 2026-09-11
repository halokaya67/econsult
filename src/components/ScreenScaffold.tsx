import { useEffect, useRef, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { announce } from "@/lib/announce";
import { useIsOffline } from "@/lib/network";
import { colors, spacing } from "@/theme/tokens";
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE, OfflineBanner } from "./OfflineBanner";

type Props = { children: ReactNode; action?: ReactNode; testID?: string };

// One scroll view per step with the primary action as its last child: no pinned footer, so the
// keyboard never covers the button and large text simply makes the page longer.
export function ScreenScaffold({ children, action, testID }: Props) {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const wasOffline = useRef(isOffline);

  useEffect(() => {
    if (isOffline === wasOffline.current) return;
    wasOffline.current = isOffline;
    announce(isOffline ? OFFLINE_MESSAGE : BACK_ONLINE_MESSAGE);
  }, [isOffline]);

  return (
    <ScrollView
      testID={testID}
      style={styles.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: spacing.lg + insets.bottom,
          paddingLeft: spacing.md + insets.left,
          paddingRight: spacing.md + insets.right,
        },
      ]}
    >
      {isOffline ? <OfflineBanner /> : null}
      {children}
      {action ? <View style={styles.action}>{action}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.md },
  action: { marginTop: spacing.sm },
});
