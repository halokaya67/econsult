import { act } from "@testing-library/react-native";
import { Dimensions, Keyboard } from "react-native";

type KeyboardListener = Parameters<typeof Keyboard.addListener>[1];
export type KeyboardFrame = Parameters<KeyboardListener>[0];

const WINDOW = Dimensions.get("window");
export const WINDOW_HEIGHT = WINDOW.height;
export const WINDOW_WIDTH = WINDOW.width;
export const KEYBOARD_TOP = Math.round(WINDOW_HEIGHT / 2);

export const addKeyboardListener = jest.spyOn(Keyboard, "addListener");
export const removeKeyboardListener = jest.fn();

// The frame iOS reports: its top edge in window coordinates, and whose keyboard it is.
export function keyboardFrame(screenY: number, isEventFromThisApp: boolean): KeyboardFrame {
  return {
    duration: 250,
    easing: "keyboard",
    isEventFromThisApp,
    startCoordinates: { screenX: 0, screenY: WINDOW_HEIGHT, width: WINDOW_WIDTH, height: 0 },
    endCoordinates: {
      screenX: 0,
      screenY,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT - screenY,
    },
  };
}

// The frame Android reports: no start frame and no owner, only where the keyboard's top edge is.
export function androidKeyboardFrame(screenY: number): KeyboardFrame {
  return {
    duration: 0,
    easing: "keyboard",
    endCoordinates: { screenX: 0, screenY, width: WINDOW_WIDTH, height: WINDOW_HEIGHT - screenY },
  };
}

// What the iPadOS photo picker reports on dismissal: an empty frame at the window origin, from this
// app, which taken at face value insets the content by a whole window.
export function emptyKeyboardFrame(): KeyboardFrame {
  return {
    duration: 250,
    easing: "keyboard",
    isEventFromThisApp: true,
    startCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
    endCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
  };
}

// Every listener of the type hears the event, as the padding and the reveal both do on Android.
export function emitKeyboardEvent(eventType: string, frame: KeyboardFrame): void {
  const listeners = addKeyboardListener.mock.calls
    .filter(([type]) => type === eventType)
    .map(([, listener]) => listener);
  expect(listeners).not.toHaveLength(0);
  act(() => listeners.forEach((listener) => listener(frame)));
}

export function emitKeyboardFrame(frame: KeyboardFrame): void {
  emitKeyboardEvent("keyboardWillChangeFrame", frame);
}
