import { onlineManager } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import * as Network from "expo-network";
import type { ReactNode } from "react";
import { isLinkDown, NetworkProvider, useIsOffline } from "./network";

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
  afterEach(() => onlineManager.setOnline(true));

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

  test("useIsOffline is false outside a provider", () => {
    const { result } = renderHook(() => useIsOffline());

    expect(result.current).toBe(false);
  });
});
