import { AccessibilityInfo } from "react-native";

export type Focusable = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

export function focusForScreenReader(node: Focusable | null): void {
  if (!node) return;
  AccessibilityInfo.sendAccessibilityEvent(node, "focus");
}
