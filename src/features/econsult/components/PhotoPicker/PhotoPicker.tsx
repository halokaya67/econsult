import * as Device from "expo-device";
import { Image } from "expo-image";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { TextButton } from "@/components/TextButton";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import {
  CAMERA_DENIED_NOTE,
  PERMISSION_DENIED_NOTE,
  PICK_FAILED_NOTE,
  PREPARING_LABEL,
  usePhotoPick,
  type Note,
  type Source,
} from "./usePhotoPick";
import type { DraftPhoto } from "../../state/draft";
import type { PickedPhoto } from "../../utils/photo";

type Props = {
  photo: DraftPhoto | null;
  disabled?: boolean;
  onPickStarted: (pickId: string, uri: string) => void;
  onPickReady: (pickId: string, result: PickedPhoto) => void;
  onRemove: () => void;
};

type PhotoStateProps = { disabled: boolean; onRemove: () => void };

export const TAKE_PHOTO_LABEL = "Take a photo";
export const CHOOSE_PHOTO_LABEL = "Choose from library";
export const REMOVE_PHOTO_LABEL = "Remove photo";
export const CAMERA_UNAVAILABLE_NOTE =
  "The camera isn't available on this device. You can choose a photo from your library.";
const PHOTO_HINT = "Add a photo if it helps, for example of a rash or a wound.";
const OPEN_SETTINGS_LABEL = "Open Settings";
export const PREVIEW_HEIGHT = 200;

// A tablet is wide enough to stretch a portrait photo into a band, so the preview stops here.
export const PREVIEW_MAX_WIDTH = 360;

function PreparingPhotoView({ disabled, onRemove }: PhotoStateProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <ActivityIndicator color={colors.primary} />
        <Text style={text.body}>{PREPARING_LABEL}</Text>
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
    return <Text style={text.muted}>{PICK_FAILED_NOTE}</Text>;
  }
  return (
    <View style={styles.stack}>
      <Text style={text.muted}>
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
  const { note, pick } = usePhotoPick({ onPickStarted, onPickReady });

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
    maxWidth: PREVIEW_MAX_WIDTH,
    height: PREVIEW_HEIGHT,
    alignSelf: "flex-start",
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
});
