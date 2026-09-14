import { useCallback, useRef, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollToFieldContext, type ScrollToField } from "@/hooks/useScrollToField";
import type { Focusable } from "@/lib/announce";
import { useIsOffline } from "@/providers/NetworkProvider";
import { colors, spacing } from "@/theme/tokens";
import { OfflineBanner } from "./OfflineBanner";

type Props = { children: ReactNode; action?: ReactNode; testID?: string };

// getInnerViewRef returns the content view element; it is absent from ScrollView's types.
type WithInnerViewRef = { getInnerViewRef?: () => Focusable | null };

// Children sit in the scroll view's content view, so their offset within it is the offset to
// scroll to; the margin keeps the field clear of the top edge. The New Architecture measures only
// against an element ref, so the node handle from getInnerViewNode is silently ignored.
function scrollFieldIntoView(scroll: ScrollView, node: Focusable): void {
  const content = (scroll as ScrollView & WithInnerViewRef).getInnerViewRef?.() ?? null;
  if (content == null) return;
  node.measureLayout(content, (_left, top) =>
    scroll.scrollTo({ x: 0, y: Math.max(0, top - spacing.md), animated: true }),
  );
}

// One scroll view per step with the primary action as its last child: no pinned footer, so the
// keyboard never covers the button and large text simply makes the page longer. The horizontal
// insets are 0 in portrait, but they are read rather than hard-coded away so a sideways or larger
// device keeps its content out of the cut-out.
export function ScreenScaffold({ children, action, testID }: Props) {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const scrollRef = useRef<ScrollView>(null);

  const scrollToField = useCallback<ScrollToField>((node) => {
    if (node && scrollRef.current) scrollFieldIntoView(scrollRef.current, node);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
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
      <ScrollToFieldContext.Provider value={scrollToField}>
        {isOffline ? <OfflineBanner /> : null}
        {children}
        {action ? <View style={styles.action}>{action}</View> : null}
      </ScrollToFieldContext.Provider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.md },
  action: { marginTop: spacing.sm },
});
