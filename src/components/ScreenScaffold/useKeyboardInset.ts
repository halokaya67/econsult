import { useEffect, useState } from "react";
import { Keyboard, Platform, useWindowDimensions, type KeyboardEvent } from "react-native";

type KeyboardFrame = KeyboardEvent["endCoordinates"];

// Only iOS says whose keyboard a frame is, so an event without the flag is this app's.
export function isForeignKeyboard(event: KeyboardEvent): boolean {
  return event.isEventFromThisApp === false;
}

// The iPadOS photo picker reports an empty frame at the window origin, which read as a keyboard
// top would inset the content by a whole window; an empty frame covers nothing.
export function isCoveringFrame(frame: KeyboardFrame): boolean {
  return frame.width > 0 && frame.height > 0;
}

// iOS says where the keyboard's top lands in the window, and a frame on its way out lands at the
// window bottom; Android says how tall the keyboard is above the navigation bar, which the content
// already pads for.
function insetFor(frame: KeyboardFrame, windowHeight: number): number {
  if (!isCoveringFrame(frame)) return 0;
  return Platform.OS === "ios" ? Math.max(windowHeight - frame.screenY, 0) : frame.height;
}

// iOS reports the frame of every keyboard on the device, including one owned by another process:
// the photo picker's runs out of process and reports its frame at the top of the screen. React
// Native's own `automaticallyAdjustKeyboardInsets` applies that frame too, which leaves every
// mounted scroll view inset by a whole screen, so only this app's keyboard is answered here.
export function useKeyboardInset(): number {
  const { height } = useWindowDimensions();
  const [inset, setInset] = useState(0);

  useEffect(() => {
    // Android has no "will" events, and its window keeps its size under the keyboard in Expo Go.
    const isIos = Platform.OS === "ios";
    const subscriptions = [
      Keyboard.addListener(isIos ? "keyboardWillChangeFrame" : "keyboardDidShow", (event) => {
        if (isForeignKeyboard(event)) return;
        setInset(insetFor(event.endCoordinates, height));
      }),
      Keyboard.addListener(isIos ? "keyboardWillHide" : "keyboardDidHide", () => setInset(0)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [height]);

  return inset;
}
