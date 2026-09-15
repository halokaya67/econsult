/// <reference types="jest" />
// TypeScript 6 no longer pulls every `node_modules/@types` package in automatically, so the jest
// globals are referenced here once and reach every test file through the program.

// jest-expo stubs the native modules but returns undefined from every call, so tests need
// real-shaped payloads. Individual tests override these with jest.mocked(...).mockResolvedValue.
let mockUuidCounter = 0;

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }),
}));

// `__esModule` keeps Babel's wildcard interop from handing a test and its component different
// copies, so `jest.replaceProperty(Device, "isDevice", false)` reaches the component.
jest.mock("expo-device", () => ({ __esModule: true, isDevice: true }));

jest.mock("expo-network", () => ({
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true, type: "WIFI" })),
}));

const mockGrantedPermission = {
  granted: true,
  status: "granted",
  canAskAgain: true,
  expires: "never",
};

jest.mock("expo-image-picker", () => ({
  useCameraPermissions: jest.fn(() => [
    mockGrantedPermission,
    jest.fn(async () => mockGrantedPermission),
    jest.fn(async () => mockGrantedPermission),
  ]),
  useMediaLibraryPermissions: jest.fn(() => [
    mockGrantedPermission,
    jest.fn(async () => mockGrantedPermission),
    jest.fn(async () => mockGrantedPermission),
  ]),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  PermissionStatus: { GRANTED: "granted", UNDETERMINED: "undetermined", DENIED: "denied" },
}));

// A working file system: every `File` remembers the uri it was built for and carries its own
// `delete`, so `src/test/photoFiles` can read which photo files the app actually removed.
jest.mock("expo-file-system", () => ({
  File: jest.fn((uri: string) => ({ uri, delete: jest.fn() })),
}));

jest.mock("expo-image-manipulator", () => {
  const mockImage = {
    saveAsync: jest.fn(async () => ({
      uri: "file:///cache/processed.jpg",
      width: 1600,
      height: 1200,
    })),
    release: jest.fn(),
  };
  const mockContext: { resize: jest.Mock; renderAsync: jest.Mock; release: jest.Mock } = {
    resize: jest.fn(() => mockContext),
    renderAsync: jest.fn(async () => mockImage),
    release: jest.fn(),
  };
  return {
    SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
    ImageManipulator: { manipulate: jest.fn(() => mockContext) },
  };
});
