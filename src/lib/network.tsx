import { onlineManager } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { announce } from "./announce";

export const OFFLINE_MESSAGE =
  "You're offline. You can keep writing, but sending needs a connection.";
export const BACK_ONLINE_MESSAGE = "You're back online.";

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
  const wasOffline = useRef(isOffline);

  // The one provider for the app announces the transition, so the patient hears it once however
  // many screens the stack keeps mounted.
  useEffect(() => {
    onlineManager.setOnline(!isOffline);
    if (isOffline === wasOffline.current) return;
    wasOffline.current = isOffline;
    announce(isOffline ? OFFLINE_MESSAGE : BACK_ONLINE_MESSAGE);
  }, [isOffline]);

  return <OfflineContext.Provider value={isOffline}>{children}</OfflineContext.Provider>;
}

export function useIsOffline(): boolean {
  return useContext(OfflineContext);
}
