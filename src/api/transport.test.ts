import { handled } from "@/test/handled";
import { ApiError, isApiError, withTimeout } from "./transport";

describe("ApiError", () => {
  test("carries its kind and status and is recognised by isApiError", () => {
    const error = new ApiError("server", "Boom", 500);

    expect(isApiError(error)).toBe(true);
    expect(error.kind).toBe("server");
    expect(error.status).toBe(500);
    expect(error.name).toBe("ApiError");
  });

  test("isApiError rejects plain errors", () => {
    expect(isApiError(new Error("x"))).toBe(false);
  });
});

describe("withTimeout", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("resolves with the value when the work finishes in time", async () => {
    const result = await withTimeout(1000, async () => "done");

    expect(result).toBe("done");
  });

  test("aborts the signal and throws a timeout ApiError when the work takes too long", async () => {
    let observed: AbortSignal | null = null;
    const work = (signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        observed = signal;
        signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });

    const pending = handled(withTimeout(1000, work));
    await jest.advanceTimersByTimeAsync(1000);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
    expect(observed!.aborted).toBe(true);
  });

  test("maps any rejection after the timeout fired onto the timeout error", async () => {
    const work = (signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        signal.addEventListener("abort", () =>
          reject(new Error("fetch failed: Fetch request has been canceled")),
        );
      });

    const pending = handled(withTimeout(1000, work));
    await jest.advanceTimersByTimeAsync(1000);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("rethrows errors that are not aborts unchanged", async () => {
    const failure = new ApiError("server", "Boom", 500);

    await expect(withTimeout(1000, async () => Promise.reject(failure))).rejects.toBe(failure);
  });
});
