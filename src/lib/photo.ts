import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { PhotoFile } from "@/api/transport";
import { devWarn } from "./devWarn";

export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_JPEG_QUALITY = 0.7;

export type PickedPhoto = { uri: string; width: number; height: number };

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
    return { uri: saved.uri, width: saved.width, height: saved.height };
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

export function photoFileFor(photo: PickedPhoto): PhotoFile {
  return { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" };
}
