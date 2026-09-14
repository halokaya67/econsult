import * as Device from "expo-device";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { TextButton } from "@/components/TextButton";
import { devWarn } from "@/lib/devWarn";
import { newId } from "@/lib/ids";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import type { DraftPhoto } from "../state/draft";
import { processPhoto, type PickedPhoto } from "../utils/photo";

export const TAKE_PHOTO_LABEL = "Take a photo";
export const CHOOSE_PHOTO_LABEL = "Choose from library";
export const REMOVE_PHOTO_LABEL = "Remove photo";
export const PREPARING_LABEL = "Preparing photo";
export const CAMERA_UNAVAILABLE_NOTE =
  "The camera isn't available on this device. You can choose a photo from your library.";
export const PERMISSION_DENIED_NOTE =
  "Photos are switched off for this app. You can allow them in Settings.";
export const CAMERA_DENIED_NOTE =
  "The camera is switched off for this app. You can allow it in Settings.";
export const PICK_FAILED_NOTE = "We couldn't open your photos just now. Please try again.";
const PHOTO_HINT = "Add a photo if it helps, for example of a rash or a wound.";
const OPEN_SETTINGS_LABEL = "Open Settings";
const PREVIEW_HEIGHT = 200;

// quality 1: the manipulator re-encodes anyway, so picker compression would be a wasted lossy pass.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 1,
  exif: false,
};

type Source = "camera" | "library";
type Permission = [
  ImagePicker.PermissionResponse | null,
  () => Promise<ImagePicker.PermissionResponse>,
];
type Note = { kind: "denied"; source: Source } | { kind: "failed" };

type Props = {
  photo: DraftPhoto | null;
  disabled?: boolean;
  onPickStarted: (pickId: string) => void;
  onPickReady: (pickId: string, result: PickedPhoto) => void;
  onRemove: () => void;
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

type PhotoStateProps = { disabled: boolean; onRemove: () => void };

function PreparingPhotoView({ disabled, onRemove }: PhotoStateProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={text.body}>
          {PREPARING_LABEL}
        </Text>
      </View>
      <TextButton label={REMOVE_PHOTO_LABEL} disabled={disabled} onPress={onRemove} />
    </View>
  );
}

// Fixed height and cover: the preview never sizes itself from the draft's width and height.
// expo-image defaults `accessible` to false, so without it the label would never be spoken.
function ReadyPhotoView({ uri, disabled, onRemove }: PhotoStateProps & { uri: string }) {
  return (
    <View style={styles.stack}>
      <Image
        source={{ uri }}
        accessible
        accessibilityLabel="Your photo"
        contentFit="cover"
        style={styles.preview}
      />
      <TextButton label={REMOVE_PHOTO_LABEL} disabled={disabled} onPress={onRemove} />
    </View>
  );
}

// Open Settings only helps a denied permission; a failed launcher is worth another tap instead.
function PickNote({ note }: { note: Note }) {
  if (note.kind === "failed") {
    return (
      <Text accessibilityLiveRegion="polite" style={text.muted}>
        {PICK_FAILED_NOTE}
      </Text>
    );
  }
  return (
    <View style={styles.stack}>
      <Text accessibilityLiveRegion="polite" style={text.muted}>
        {note.source === "camera" ? CAMERA_DENIED_NOTE : PERMISSION_DENIED_NOTE}
      </Text>
      <TextButton label={OPEN_SETTINGS_LABEL} onPress={() => void Linking.openSettings()} />
    </View>
  );
}

function SourceButtons({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (source: Source) => void;
}) {
  return (
    <>
      {Device.isDevice ? (
        <TextButton label={TAKE_PHOTO_LABEL} disabled={disabled} onPress={() => onPick("camera")} />
      ) : (
        <Text style={text.muted}>{CAMERA_UNAVAILABLE_NOTE}</Text>
      )}
      <TextButton
        label={CHOOSE_PHOTO_LABEL}
        disabled={disabled}
        onPress={() => onPick("library")}
      />
    </>
  );
}

export function PhotoPicker({
  photo,
  disabled = false,
  onPickStarted,
  onPickReady,
  onRemove,
}: Props) {
  const [cameraStatus, requestCamera] = ImagePicker.useCameraPermissions();
  const [libraryStatus, requestLibrary] = ImagePicker.useMediaLibraryPermissions();
  const [note, setNote] = useState<Note | null>(null);

  // The permission choice stays out of the try block: a value expression inside try/catch makes the
  // React Compiler bail out of the whole component, and the ternary cannot throw anyway.
  async function pick(source: Source) {
    const permission: Permission =
      source === "camera" ? [cameraStatus, requestCamera] : [libraryStatus, requestLibrary];
    try {
      if (!(await ensureGranted(permission))) return setNote({ kind: "denied", source });
      setNote(null);
      const result = await launch(source);
      if (result.canceled) return;
      const asset = result.assets[0];
      const pickId = newId();
      onPickStarted(pickId);
      onPickReady(
        pickId,
        await processPhoto({ uri: asset.uri, width: asset.width, height: asset.height }),
      );
    } catch (error) {
      devWarn(`Photo pick failed: ${String(error)}`);
      setNote({ kind: "failed" });
    }
  }

  if (photo?.status === "preparing") {
    return <PreparingPhotoView disabled={disabled} onRemove={onRemove} />;
  }
  if (photo?.status === "ready") {
    return <ReadyPhotoView uri={photo.uri} disabled={disabled} onRemove={onRemove} />;
  }

  return (
    <View style={styles.stack}>
      <Text style={text.body}>{PHOTO_HINT}</Text>
      <SourceButtons disabled={disabled} onPick={(source) => void pick(source)} />
      {note ? <PickNote note={note} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  preview: {
    width: "100%",
    height: PREVIEW_HEIGHT,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
});
