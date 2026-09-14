import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Focusable } from "@/lib/announce";
import { useIsOffline } from "@/providers/NetworkProvider";
import { colors, spacing } from "@/theme/tokens";
import { OfflineBanner } from "./OfflineBanner";

type Props = { children: ReactNode; action?: ReactNode; testID?: string };

export type ScrollToField = (node: Focusable | null) => void;

// The scaffold owns the scroll view and provides the real implementation; outside one the default
// no-op keeps the call site unconditional.
const ScrollToFieldContext = createContext<ScrollToField>(() => {});

// Large text can push a validation error far above the viewport, where moving screen-reader focus
// to it leaves the screen looking untouched. Only components rendered inside the scaffold reach
// its scroll view, so a screen reads this from its action rather than from itself.
export function useScrollToField(): ScrollToField {
  return useContext(ScrollToFieldContext);
}

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

// iOS reports the frame of every keyboard on the device, including one owned by another process:
// the photo picker's runs out of process and reports its frame at the top of the screen. React
// Native's own `automaticallyAdjustKeyboardInsets` applies that frame too, which leaves every
// mounted scroll view inset by a whole screen, so only this app's keyboard is answered here.
function useKeyboardInset(): number {
  const { height } = useWindowDimensions();
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const subscriptions = [
      Keyboard.addListener("keyboardWillChangeFrame", (event) => {
        if (!event.isEventFromThisApp) return;
        const frame = event.endCoordinates;
        // The iPadOS photo picker reports an empty frame at the window origin, which read as a
        // keyboard top would inset the content by a whole window; an empty frame covers nothing.
        const isCovering = frame.width > 0 && frame.height > 0;
        setInset(isCovering ? Math.max(height - frame.screenY, 0) : 0);
      }),
      Keyboard.addListener("keyboardWillHide", () => setInset(0)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [height]);

  return inset;
}

// One scroll view per step with the primary action as its last child: no pinned footer, so the
// keyboard never covers the button and large text simply makes the page longer. The horizontal
// insets are 0 in portrait, but they are read rather than hard-coded away so a sideways or larger
// device keeps its content out of the cut-out.
export function ScreenScaffold({ children, action, testID }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
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
