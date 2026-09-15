import { TextButton } from "@/components/TextButton";
import { HEADER_BUTTON_MAX_FONT_SCALE } from "@/theme/tokens";

// The native bar cannot grow, so the label caps its text like an iOS bar button.
export function CancelHeaderButton({ onPress }: { onPress: () => void }) {
  return (
    <TextButton
      label="Cancel"
      onPress={onPress}
      maxFontSizeMultiplier={HEADER_BUTTON_MAX_FONT_SCALE}
    />
  );
}
