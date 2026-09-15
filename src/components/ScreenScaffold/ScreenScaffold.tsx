import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Focusable } from "@/lib/announce";
import { useIsOffline } from "@/providers/NetworkProvider";
import { colors, spacing } from "@/theme/tokens";
import { OfflineBanner } from "../OfflineBanner";
import { scrollFieldIntoView } from "./scrollToField";
import { useKeyboardInset } from "./useKeyboardInset";
import { useRelayoutFlag } from "./useRelayoutFlag";
import { useRevealFocusedInput } from "./useRevealFocusedInput";

export type ScrollToField = (node: Focusable | null) => void;

// Asked from an effect or a handler, never during render: the answer is only settled once the
// commit that remounted the page is done, and a ref read in render is what the compiler rejects.
export type IsRelayout = () => boolean;

type Props = { children: ReactNode; action?: ReactNode; testID?: string };

// The scaffold owns the scroll view and provides the real implementation; outside one the default
// no-op keeps the call site unconditional.
const ScrollToFieldContext = createContext<ScrollToField>(() => {});

// Outside a scaffold nothing remounts a page under the patient, so every mount is an arrival.
const IsRelayoutContext = createContext<IsRelayout>(() => false);

// Large text can push a validation error far above the viewport, where moving screen-reader focus
// to it leaves the screen looking untouched. Only components rendered inside the scaffold reach
// its scroll view, so a screen reads this from its action rather than from itself.
export function useScrollToField(): ScrollToField {
  return useContext(ScrollToFieldContext);
}

// The scaffold is what remounts the page on a text-size change, so only it can tell a re-layout
// from an arrival; anything that speaks on mount asks before speaking.
export function useIsRelayout(): IsRelayout {
  return useContext(IsRelayoutContext);
}

// One scroll view per step with the primary action as its last child: no pinned footer, so the
// keyboard never covers the button and large text simply makes the page longer. The horizontal
// insets are 0 in portrait, but they are read rather than hard-coded away so a sideways or larger
// device keeps its content out of the cut-out.
export function ScreenScaffold({ children, action, testID }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  // A text-size change while the app runs repaints the glyphs but leaves every box at the size it
  // was measured at, so the content is keyed on the scale; what the patient typed is in the draft.
  const { fontScale } = useWindowDimensions();
  const isOffline = useIsOffline();
  const scrollRef = useRef<ScrollView>(null);
  const isRelayout = useRelayoutFlag(fontScale);
  const onContentSizeChange = useRevealFocusedInput(scrollRef);

  const scrollToField = useCallback<ScrollToField>((node) => {
    if (node && scrollRef.current) scrollFieldIntoView(scrollRef.current, node);
  }, []);

  return (
    <ScrollView
      key={fontScale}
      ref={scrollRef}
      testID={testID}
      style={styles.scroll}
      onContentSizeChange={onContentSizeChange}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: spacing.lg + insets.bottom + keyboardInset,
          paddingLeft: spacing.md + insets.left,
          paddingRight: spacing.md + insets.right,
        },
      ]}
    >
      <ScrollToFieldContext.Provider value={scrollToField}>
        <IsRelayoutContext.Provider value={isRelayout}>
          {isOffline ? <OfflineBanner /> : null}
          {children}
          {action ? <View style={styles.action}>{action}</View> : null}
        </IsRelayoutContext.Provider>
      </ScrollToFieldContext.Provider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.md },
  action: { marginTop: spacing.sm },
});
