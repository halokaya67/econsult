import { AccessibilityInfo } from "react-native";

export type Focusable = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

export function focusForScreenReader(node: Focusable | null): void {
  if (!node) return;
  AccessibilityInfo.sendAccessibilityEvent(node, "focus");
}

// A field's accessible name already carries its error, so focusing the field speaks it; announcing
// as well would say it twice. Only a field with no node to focus needs the announcement.
export function focusOrAnnounce(node: Focusable | null, message: string): void {
  if (node) focusForScreenReader(node);
  else announce(message);
}
