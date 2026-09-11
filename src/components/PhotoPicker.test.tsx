import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";
import {
  CAMERA_UNAVAILABLE_NOTE,
  CHOOSE_PHOTO_LABEL,
  PERMISSION_DENIED_NOTE,
  PhotoPicker,
  PREPARING_LABEL,
  REMOVE_PHOTO_LABEL,
  TAKE_PHOTO_LABEL,
} from "./PhotoPicker";

// Without __esModule, Babel's wildcard interop hands this file and the component separate copies of
// the module, so replacing isDevice here would never reach the component.
jest.mock("expo-device", () => ({ __esModule: true, isDevice: true }));

type Photo = React.ComponentProps<typeof PhotoPicker>["photo"];

const ASSET = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };
const denied = {
  granted: false,
  status: ImagePicker.PermissionStatus.DENIED,
  canAskAgain: false,
  expires: "never" as const,
};

function renderPicker(photo: Photo = null, disabled = false) {
  const handlers = { onPickStarted: jest.fn(), onPickReady: jest.fn(), onRemove: jest.fn() };
  render(<PhotoPicker photo={photo} disabled={disabled} {...handlers} />);
  return handlers;
}

describe("PhotoPicker", () => {
  afterEach(() => jest.restoreAllMocks());

  test("offers the camera and the library on a real device", () => {
    renderPicker();

    expect(screen.getByRole("button", { name: TAKE_PHOTO_LABEL })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL })).toBeOnTheScreen();
  });

  test("hides the camera with a note when there is no camera", () => {
    jest.replaceProperty(Device, "isDevice", false);

    renderPicker();

    expect(screen.queryByRole("button", { name: TAKE_PHOTO_LABEL })).toBeNull();
    expect(screen.getByText(CAMERA_UNAVAILABLE_NOTE)).toBeOnTheScreen();
  });

  test("a library pick starts a preparing photo and delivers the processed result", async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    const pickId = handlers.onPickStarted.mock.calls[0][0];
    expect(handlers.onPickReady).toHaveBeenCalledWith(pickId, {
      uri: "file:///cache/processed.jpg",
      width: 1600,
      height: 1200,
    });
  });

  test("a camera pick uses the camera launcher at full quality", async () => {
    jest
      .mocked(ImagePicker.launchCameraAsync)
      .mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: TAKE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
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

  test("a denied permission explains itself and offers Settings", async () => {
    jest
      .spyOn(ImagePicker, "useMediaLibraryPermissions")
      .mockReturnValue([denied, jest.fn(async () => denied), jest.fn(async () => denied)]);
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(await screen.findByText(PERMISSION_DENIED_NOTE)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Open Settings" }));
    expect(openSettings).toHaveBeenCalled();
    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("shows the preparing state as a live region and still offers Remove", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker({ status: "preparing", pickId: "p1" });

    expect(screen.getByText(PREPARING_LABEL).props.accessibilityLiveRegion).toBe("polite");
    expect(screen.queryByRole("button", { name: CHOOSE_PHOTO_LABEL })).toBeNull();
    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));

    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  test("shows the preview with a remove button once ready", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker({
      status: "ready",
      pickId: "p1",
      uri: "file:///cache/p.jpg",
      width: 10,
      height: 10,
    });

    expect(screen.getByLabelText("Your photo")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));

    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  test("disables every action while sending", () => {
    renderPicker(
      { status: "ready", pickId: "p1", uri: "file:///cache/p.jpg", width: 10, height: 10 },
      true,
    );

    expect(
      screen.getByRole("button", { name: REMOVE_PHOTO_LABEL, disabled: true }),
    ).toBeOnTheScreen();
  });
});
