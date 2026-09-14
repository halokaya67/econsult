import type { QueryClient } from "@tanstack/react-query";
import { handled } from "@/test/handled";
import { createQueryClient, READ_RETRY_COUNT, READ_RETRY_DELAY_MS } from "./queryClient";

const READ_KEY = ["practice-config"];
const CONFIG = { practiceId: "prc-0421" };
// The documented promise is one attempt plus one retry, spelled out rather than derived from
// READ_RETRY_COUNT so that moving the constant has to move this expectation too.
const EXPECTED_ATTEMPTS = 2;
// Room for more retries than the one configured, so an extra attempt shows up as an extra call
// rather than as a test that hangs.
const SETTLE_MS = READ_RETRY_DELAY_MS * 4;

describe("createQueryClient", () => {
  test("reads retry once after one second and run offline-first", () => {
    const client = createQueryClient();

    const queries = client.getDefaultOptions().queries;

    expect(queries).toMatchObject({
      retry: READ_RETRY_COUNT,
      retryDelay: READ_RETRY_DELAY_MS,
      networkMode: "offlineFirst",
    });
  });

  test("mutations never retry and always run", () => {
    const client = createQueryClient();

    expect(client.getDefaultOptions().mutations).toMatchObject({ retry: 0, networkMode: "always" });
  });
});

describe("a read on the app's query client", () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.useFakeTimers();
    client = createQueryClient();
  });

  afterEach(() => {
    client.clear();
    jest.useRealTimers();
  });

  test("recovers on its single retry, a retry delay after the first attempt failed", async () => {
    const queryFn = jest.fn(async () => CONFIG);
    queryFn.mockRejectedValueOnce(new Error("the link dropped"));

    const pending = client.fetchQuery({ queryKey: READ_KEY, queryFn, gcTime: 0 });
    await jest.advanceTimersByTimeAsync(READ_RETRY_DELAY_MS - 1);
    const attemptsBeforeTheDelay = queryFn.mock.calls.length;
    await jest.advanceTimersByTimeAsync(SETTLE_MS);

    expect(attemptsBeforeTheDelay).toBe(1);
    await expect(pending).resolves.toEqual(CONFIG);
    expect(queryFn).toHaveBeenCalledTimes(EXPECTED_ATTEMPTS);
  });

  test("surfaces the error when the retry fails too", async () => {
    const queryFn = jest.fn(async () => {
      throw new Error("the practice service is down");
    });

    const pending = handled(client.fetchQuery({ queryKey: READ_KEY, queryFn, gcTime: 0 }));
    await jest.advanceTimersByTimeAsync(SETTLE_MS);

    await expect(pending).rejects.toThrow("the practice service is down");
    expect(queryFn).toHaveBeenCalledTimes(EXPECTED_ATTEMPTS);
  });
});
