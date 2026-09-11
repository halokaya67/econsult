import * as Device from "expo-device";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import type { DraftPhoto } from "@/features/econsult/draft";
import { newId } from "@/lib/ids";
import { processPhoto, type PickedPhoto } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { TextButton } from "./TextButton";

export const TAKE_PHOTO_LABEL = "Take a photo";
export const CHOOSE_PHOTO_LABEL = "Choose from library";
export const REMOVE_PHOTO_LABEL = "Remove photo";
export const PREPARING_LABEL = "Preparing photo";
export const CAMERA_UNAVAILABLE_NOTE =
  "The camera isn't available on this device. You can choose a photo from your library.";
export const PERMISSION_DENIED_NOTE =
  "Photos are switched off for this app. You can allow them in Settings.";
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
function ReadyPhotoView({ uri, disabled, onRemove }: PhotoStateProps & { uri: string }) {
  return (
    <View style={styles.stack}>
      <Image
        source={{ uri }}
        accessibilityLabel="Your photo"
        contentFit="cover"
        style={styles.preview}
      />
      <TextButton label={REMOVE_PHOTO_LABEL} disabled={disabled} onPress={onRemove} />
    </View>
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
  const [denied, setDenied] = useState(false);

  async function pick(source: Source) {
    const permission: Permission =
      source === "camera" ? [cameraStatus, requestCamera] : [libraryStatus, requestLibrary];
    if (!(await ensureGranted(permission))) return setDenied(true);
    setDenied(false);
    const result = await launch(source);
    if (result.canceled) return;
    const asset = result.assets[0];
    const pickId = newId();
    onPickStarted(pickId);
    onPickReady(
      pickId,
      await processPhoto({ uri: asset.uri, width: asset.width, height: asset.height }),
    );
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
      {Device.isDevice ? (
        <TextButton
          label={TAKE_PHOTO_LABEL}
          disabled={disabled}
          onPress={() => void pick("camera")}
        />
      ) : (
        <Text style={text.muted}>{CAMERA_UNAVAILABLE_NOTE}</Text>
      )}
      <TextButton
        label={CHOOSE_PHOTO_LABEL}
        disabled={disabled}
        onPress={() => void pick("library")}
      />
      {denied ? (
        <View style={styles.stack}>
          <Text accessibilityLiveRegion="polite" style={text.muted}>
            {PERMISSION_DENIED_NOTE}
          </Text>
          <TextButton label={OPEN_SETTINGS_LABEL} onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
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
