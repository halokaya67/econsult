import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { announce } from "@/lib/announce";
import { devWarn } from "@/lib/devWarn";
import { newId } from "@/lib/ids";
import { processPhoto, type PickedPhoto } from "../../utils/photo";

export type Source = "camera" | "library";
export type Note = { kind: "denied"; source: Source } | { kind: "failed" };

type Permission = [
  ImagePicker.PermissionResponse | null,
  () => Promise<ImagePicker.PermissionResponse>,
];

type Handlers = {
  onPickStarted: (pickId: string, uri: string) => void;
  onPickReady: (pickId: string, result: PickedPhoto) => void;
};

// The hook speaks these where it sets the note, so it owns them; the picker renders the same words.
export const PREPARING_LABEL = "Preparing photo";
export const PERMISSION_DENIED_NOTE =
  "Photos are switched off for this app. You can allow them in Settings.";
export const CAMERA_DENIED_NOTE =
  "The camera is switched off for this app. You can allow it in Settings.";
export const PICK_FAILED_NOTE = "We couldn't open your photos just now. Please try again.";

// quality 1: the manipulator re-encodes anyway, so picker compression would be a wasted lossy pass.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 1,
  exif: false,
};

async function ensureGranted([status, request]: Permission): Promise<boolean> {
  if (status?.granted) return true;
  const next = await request();
  return next.granted;
}

function launch(source: Source) {
  return source === "camera"
    ? ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
}

export function usePhotoPick({ onPickStarted, onPickReady }: Handlers) {
  const [cameraStatus, requestCamera] = ImagePicker.useCameraPermissions();
  const [libraryStatus, requestLibrary] = ImagePicker.useMediaLibraryPermissions();
  const [note, setNote] = useState<Note | null>(null);

  // The permission choice stays out of the try block: a value expression inside try/catch makes the
  // React Compiler bail out of the whole hook, and the ternary cannot throw anyway.
  async function pick(source: Source) {
    const permission: Permission =
      source === "camera" ? [cameraStatus, requestCamera] : [libraryStatus, requestLibrary];
    try {
      if (!(await ensureGranted(permission))) {
        announce(source === "camera" ? CAMERA_DENIED_NOTE : PERMISSION_DENIED_NOTE);
        return setNote({ kind: "denied", source });
      }
      setNote(null);
      const result = await launch(source);
      if (result.canceled) return;
      const asset = result.assets[0];
      const pickId = newId();
      onPickStarted(pickId, asset.uri);
      announce(PREPARING_LABEL);
      onPickReady(
        pickId,
        await processPhoto({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType,
        }),
      );
    } catch (error) {
      devWarn(`Photo pick failed: ${String(error)}`);
      announce(PICK_FAILED_NOTE);
      setNote({ kind: "failed" });
    }
  }

  return { note, pick };
}
