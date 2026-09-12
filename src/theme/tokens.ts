export const colors = {
  background: "#FFFFFF",
  surface: "#F3F6F7",
  text: "#16262B",
  muted: "#55686D",
  primary: "#0F6B75",
  onPrimary: "#FFFFFF",
  border: "#C7D1D4",
  selected: "#E3F1F2",
  error: "#B3261E",
  errorSurface: "#FCEBEA",
  warning: "#6B4A00",
  warningSurface: "#FFF3D6",
  disabled: "#9AA9AD",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const fontSize = { small: 15, body: 17, large: 20, heading: 24, title: 30 } as const;

export const lineHeight = { body: 24, heading: 32, title: 38 } as const;

export const radius = 12;

// 48 satisfies Android's 48 dp guidance and exceeds Apple's 44 pt.
export const MIN_TOUCH = 48;

// The only place font scaling is capped: a chip that must stay a chip.
export const STEP_CHIP_MAX_FONT_SCALE = 2;

// The native navigation bar cannot grow, so its buttons cap their text like iOS bar buttons do.
export const HEADER_BUTTON_MAX_FONT_SCALE = 1.3;
