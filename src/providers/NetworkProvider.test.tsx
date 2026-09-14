import { onlineManager } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import * as Network from "expo-network";
import type { ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import {
  BACK_ONLINE_MESSAGE,
  isLinkDown,
  NetworkProvider,
  OFFLINE_MESSAGE,
  useIsOffline,
} from "./NetworkProvider";

const mockedState = jest.mocked(Network.useNetworkState);

function wrapperWith(forceOffline: boolean) {
  return function NetworkWrapper({ children }: { children: ReactNode }) {
    return <NetworkProvider forceOffline={forceOffline}>{children}</NetworkProvider>;
  };
}

describe("isLinkDown", () => {
  test.each([
    [true, false, false],
    [undefined, false, false],
    [false, false, true],
    [true, true, true],
  ])("isConnected=%s forceOffline=%s -> %s", (isConnected, forceOffline, expected) => {
    expect(isLinkDown(isConnected, forceOffline)).toBe(expected);
  });
});

describe("NetworkProvider", () => {
  afterEach(() => {
    onlineManager.setOnline(true);
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    jest.restoreAllMocks();
  });

  test("reports online and tells the query client so when the link is up", () => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(false);
    expect(onlineManager.isOnline()).toBe(true);
  });

  test("reports offline and pauses the query client when the link is reported down", () => {
    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(true);
    expect(onlineManager.isOnline()).toBe(false);
  });

  test("treats an unknown link state as online", () => {
    mockedState.mockReturnValue({});

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(false);
  });

  test("forceOffline wins over a healthy link", () => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(true) });

    expect(result.current).toBe(true);
    expect(onlineManager.isOnline()).toBe(false);
  });

  test("says nothing about the link on mount, even when it is already down", () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });

    renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(announce).not.toHaveBeenCalled();
  });

  test("announces the link going down once, and coming back once", () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    const { rerender } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });
    rerender(undefined);
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    rerender(undefined);

    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenNthCalledWith(1, OFFLINE_MESSAGE);
    expect(announce).toHaveBeenNthCalledWith(2, BACK_ONLINE_MESSAGE);
  });
});

describe("useIsOffline", () => {
  test("is false outside a provider", () => {
    const { result } = renderHook(() => useIsOffline());

    expect(result.current).toBe(false);
  });
});
