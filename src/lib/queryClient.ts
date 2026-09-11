import { QueryClient } from "@tanstack/react-query";

export const READ_RETRY_COUNT = 1;
export const READ_RETRY_DELAY_MS = 1000;
export const STALE_TIME_MS = 30_000;

// Reads are offline-first so the first attempt always runs (the fake is in-process); the send
// mutation runs "always" so it can never sit paused with a spinner that lies.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: READ_RETRY_COUNT,
        retryDelay: READ_RETRY_DELAY_MS,
        networkMode: "offlineFirst",
        staleTime: STALE_TIME_MS,
      },
      mutations: { retry: 0, networkMode: "always" },
    },
  });
}
