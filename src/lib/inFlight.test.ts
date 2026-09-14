import { runOnce } from "./inFlight";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe("runOnce", () => {
  test("ignores a second call that lands while the first is still pending", async () => {
    const flag = { current: false };
    const gate = deferred();
    const work = jest.fn(() => gate.promise);

    const first = runOnce(flag, work);
    await runOnce(flag, work);

    gate.resolve();
    await first;
    expect(work).toHaveBeenCalledTimes(1);
  });

  test("holds the flag up for the work and clears it once the work resolves", async () => {
    const flag = { current: false };
    const gate = deferred();

    const settled = runOnce(flag, () => gate.promise);
    const heldWhilePending = flag.current;

    gate.resolve();
    await settled;
    expect(heldWhilePending).toBe(true);
    expect(flag.current).toBe(false);
  });

  test("clears the flag when the work throws, and hands the failure on", async () => {
    const flag = { current: false };
    const boom = new Error("boom");

    await expect(runOnce(flag, () => Promise.reject(boom))).rejects.toBe(boom);

    expect(flag.current).toBe(false);
  });

  test("runs the work again once the first call has settled", async () => {
    const flag = { current: false };
    const work = jest.fn(async () => {});

    await runOnce(flag, work);
    await runOnce(flag, work);

    expect(work).toHaveBeenCalledTimes(2);
  });
});
