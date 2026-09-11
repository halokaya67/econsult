import { onlineManager } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { createContext, useContext, useEffect, type ReactNode } from "react";

const OfflineContext = createContext<boolean>(false);

// Fail-open: only an explicit "not connected" counts as offline; unknown counts as online.
export function isLinkDown(isConnected: boolean | undefined, forceOffline: boolean): boolean {
  return forceOffline || isConnected === false;
}

export function NetworkProvider({
  forceOffline,
  children,
}: {
  forceOffline: boolean;
  children: ReactNode;
}) {
  const state = useNetworkState();
  const isOffline = isLinkDown(state.isConnected, forceOffline);

  useEffect(() => {
    onlineManager.setOnline(!isOffline);
  }, [isOffline]);

  return <OfflineContext.Provider value={isOffline}>{children}</OfflineContext.Provider>;
}

export function useIsOffline(): boolean {
  return useContext(OfflineContext);
}
