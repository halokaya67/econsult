import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { PhotoFile } from "@/api/transport";
import { devWarn } from "@/lib/devWarn";

export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_JPEG_QUALITY = 0.7;
export const PHOTO_MIME_JPEG = "image/jpeg";

const JPEG_EXTENSION = "jpg";

// Only the copies the picker and the manipulator wrote into our cache are ours to delete; a `ph://`
// or `content://` uri names the patient's own library item.
const FILE_SCHEME = "file://";

// The picker may hand back any of these untouched when processing fails; anything else is declared
// a JPEG, which is what the endpoint accepts by default.
const EXTENSIONS: Readonly<Record<string, string | undefined>> = {
  [PHOTO_MIME_JPEG]: JPEG_EXTENSION,
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type PickedPhoto = { uri: string; width: number; height: number; mimeType?: string };

type Context = ReturnType<typeof ImageManipulator.manipulate>;
type ResizeTarget = { width: number } | { height: number };

// The picker documents width and height as possibly 0; then the long edge is unknown and null tells
// the caller to keep the original rather than risk enlarging a small image.
export function resizeTargetFor(width: number, height: number): ResizeTarget | null {
  if (width <= 0 || height <= 0) return null;
  return width >= height
    ? { width: Math.min(PHOTO_MAX_EDGE, width) }
    : { height: Math.min(PHOTO_MAX_EDGE, height) };
}

async function renderAndSave(context: Context, target: ResizeTarget): Promise<PickedPhoto> {
  const image = await context.resize(target).renderAsync();
  try {
    const saved = await image.saveAsync({ compress: PHOTO_JPEG_QUALITY, format: SaveFormat.JPEG });
    return {
      uri: saved.uri,
      width: saved.width,
      height: saved.height,
      mimeType: PHOTO_MIME_JPEG,
    };
  } finally {
    image.release();
  }
}

// Downscale at pick time so a 12-megapixel capture becomes a sub-megabyte upload; on any failure
// the original is kept so the patient never loses the photo.
export async function processPhoto(asset: PickedPhoto): Promise<PickedPhoto> {
  const target = resizeTargetFor(asset.width, asset.height);
  if (target === null) {
    devWarn("Photo dimensions unknown, keeping the original");
    return asset;
  }
  let context: Context | null = null;
  try {
    context = ImageManipulator.manipulate(asset.uri);
    return await renderAndSave(context, target);
  } catch (error) {
    devWarn(`Photo processing failed, keeping the original: ${String(error)}`);
    return asset;
  } finally {
    context?.release();
  }
}

// A kept original is uploaded under its own type, but never under its own name: "photo.<ext>" is
// all the server ever learns about the file the patient picked.
export function photoFileFor(photo: PickedPhoto): PhotoFile {
  const type = photo.mimeType ?? PHOTO_MIME_JPEG;
  const extension = EXTENSIONS[type];
  if (extension === undefined) {
    return { uri: photo.uri, name: `photo.${JPEG_EXTENSION}`, type: PHOTO_MIME_JPEG };
  }
  return { uri: photo.uri, name: `photo.${extension}`, type };
}

// A photo of a rash must not outlive the message it went with, so every file the draft named is
// deleted at once. `File#delete` throws when the file is already gone, and that is nobody's problem.
export function discardPhotoFiles(uris: Iterable<string>): void {
  for (const uri of uris) {
    if (!uri.startsWith(FILE_SCHEME)) continue;
    try {
      new File(uri).delete();
    } catch (error) {
      devWarn(`Photo file could not be deleted: ${String(error)}`);
    }
  }
}
