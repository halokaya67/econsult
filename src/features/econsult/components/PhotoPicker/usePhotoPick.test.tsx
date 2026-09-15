import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { ImageManipulator } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { AccessibilityInfo } from "react-native";
import { CHOOSE_PHOTO_LABEL, PhotoPicker, TAKE_PHOTO_LABEL } from "./PhotoPicker";
import {
  CAMERA_DENIED_NOTE,
  PERMISSION_DENIED_NOTE,
  PICK_FAILED_NOTE,
  PREPARING_LABEL,
} from "./usePhotoPick";

const ASSET = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };
const denied = {
  granted: false,
  status: ImagePicker.PermissionStatus.DENIED,
  canAskAgain: false,
  expires: "never" as const,
};
const granted = { ...denied, granted: true, status: ImagePicker.PermissionStatus.GRANTED };

// `jest.spyOn` on this wildcard-interop module survives `restoreAllMocks`, so a test that needs a
// permission state says so instead of inheriting the previous test's.
function mockPermission(
  hook: "useCameraPermissions" | "useMediaLibraryPermissions",
  response: ImagePicker.PermissionResponse,
) {
  jest
    .spyOn(ImagePicker, hook)
    .mockReturnValue([response, jest.fn(async () => response), jest.fn(async () => response)]);
}

// The picker is the hook's only host, so the pick is driven through its buttons.
function renderPicker() {
  const handlers = { onPickStarted: jest.fn(), onPickReady: jest.fn(), onRemove: jest.fn() };
  render(<PhotoPicker photo={null} {...handlers} />);
  return handlers;
}

// The preset already mocks the announcer, so the spy is the mock every earlier test wrote to.
function spyAnnounce() {
  const announce = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {});
  announce.mockClear();
  return announce;
}

describe("usePhotoPick", () => {
  afterEach(() => jest.restoreAllMocks());

  test("a library pick starts a preparing photo and delivers the processed result", async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    const pickId = handlers.onPickStarted.mock.calls[0][0];
    // The picked file is a copy in the app's cache, and naming it is what lets the flow delete it.
    expect(handlers.onPickStarted).toHaveBeenCalledWith(pickId, ASSET.uri);
    expect(handlers.onPickReady).toHaveBeenCalledWith(pickId, {
      uri: "file:///cache/processed.jpg",
      width: 1600,
      height: 1200,
      mimeType: "image/jpeg",
    });
  });

  test("hands on the original's own type when processing fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const png = { ...ASSET, uri: "file:///cache/original.png", mimeType: "image/png" };
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [png] });
    jest
      .mocked(ImageManipulator.manipulate(png.uri))
      .renderAsync.mockRejectedValueOnce(new Error("decode failed"));
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    expect(handlers.onPickReady).toHaveBeenCalledWith(expect.any(String), png);
  });

  test("a camera pick uses the camera launcher at full quality", async () => {
    jest
      .mocked(ImagePicker.launchCameraAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    const announce = spyAnnounce();
    await user.press(screen.getByRole("button", { name: TAKE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    expect(announce.mock.calls.filter(([line]) => line === PREPARING_LABEL)).toHaveLength(1);
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 1 }),
    );
  });

  test("a cancelled pick changes nothing", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("a denied permission is spoken once and starts no pick", async () => {
    mockPermission("useMediaLibraryPermissions", denied);
    const announce = spyAnnounce();
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(await screen.findByText(PERMISSION_DENIED_NOTE)).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line === PERMISSION_DENIED_NOTE)).toHaveLength(1);
    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("a denied camera permission is spoken as the camera's, not the library's", async () => {
    mockPermission("useCameraPermissions", denied);
    const announce = spyAnnounce();
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: TAKE_PHOTO_LABEL }));

    expect(await screen.findByText(CAMERA_DENIED_NOTE)).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line === CAMERA_DENIED_NOTE)).toHaveLength(1);
    expect(announce.mock.calls.filter(([line]) => line === PERMISSION_DENIED_NOTE)).toHaveLength(0);
    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("a launcher that fails is spoken once, warns and starts no pick", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockPermission("useMediaLibraryPermissions", granted);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockRejectedValueOnce(new Error("busy"));
    const announce = spyAnnounce();
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(await screen.findByText(PICK_FAILED_NOTE)).toBeOnTheScreen();
    expect(announce.mock.calls.filter(([line]) => line === PICK_FAILED_NOTE)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("busy"));
    expect(handlers.onPickStarted).not.toHaveBeenCalled();
    expect(handlers.onPickReady).not.toHaveBeenCalled();
  });
});
