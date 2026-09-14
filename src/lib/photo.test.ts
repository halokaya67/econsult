import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_EDGE,
  photoFileFor,
  processPhoto,
  resizeTargetFor,
} from "./photo";

const manipulate = jest.mocked(ImageManipulator.manipulate);
const ORIGINAL = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };

describe("resizeTargetFor", () => {
  test("bounds the width of a landscape photo", () => {
    expect(resizeTargetFor(4000, 3000)).toEqual({ width: PHOTO_MAX_EDGE });
  });

  test("bounds the height of a portrait photo", () => {
    expect(resizeTargetFor(3000, 4000)).toEqual({ height: PHOTO_MAX_EDGE });
  });

  test("never upscales a small photo", () => {
    expect(resizeTargetFor(800, 600)).toEqual({ width: 800 });
  });

  test("reports an unknown long edge when the picker reports a zero dimension", () => {
    expect(resizeTargetFor(0, 3000)).toBeNull();
    expect(resizeTargetFor(3000, 0)).toBeNull();
  });
});

describe("processPhoto", () => {
  test("resizes, saves as JPEG at the chosen quality and releases both native handles", async () => {
    const result = await processPhoto(ORIGINAL);

    const context = manipulate.mock.results[0].value;
    const image = await context.renderAsync.mock.results[0].value;
    expect(manipulate).toHaveBeenCalledWith(ORIGINAL.uri);
    expect(context.resize).toHaveBeenCalledWith({ width: PHOTO_MAX_EDGE });
    expect(image.saveAsync).toHaveBeenCalledWith({
      compress: PHOTO_JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    expect(result).toEqual({ uri: "file:///cache/processed.jpg", width: 1600, height: 1200 });
    expect(image.release).toHaveBeenCalled();
    expect(context.release).toHaveBeenCalled();
  });

  test("keeps the original, releases the context and warns when processing fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const context = jest.mocked(manipulate(ORIGINAL.uri));
    context.renderAsync.mockRejectedValueOnce(new Error("decode failed"));
    // One context mock is shared by the whole file, so the count only means this call's release.
    context.release.mockClear();

    const result = await processPhoto(ORIGINAL);

    expect(result).toEqual(ORIGINAL);
    expect(context.release).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("decode failed"));
    warn.mockRestore();
  });

  test("keeps the original without touching the manipulator when a dimension is unknown", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    manipulate.mockClear();
    const asset = { ...ORIGINAL, height: 0 };

    const result = await processPhoto(asset);

    expect(result).toEqual(asset);
    expect(manipulate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown"));
    warn.mockRestore();
  });
});

describe("photoFileFor", () => {
  test("names the upload part as a JPEG", () => {
    expect(photoFileFor({ uri: "file:///cache/p.jpg", width: 1, height: 1 })).toEqual({
      uri: "file:///cache/p.jpg",
      name: "photo.jpg",
      type: "image/jpeg",
    });
  });
});
