import { devWarn, isDevelopmentBuild } from "./devWarn";

const devFlag = globalThis as unknown as { __DEV__: boolean };

describe("devWarn", () => {
  const original = devFlag.__DEV__;
  afterEach(() => {
    devFlag.__DEV__ = original;
    jest.restoreAllMocks();
  });

  test("isDevelopmentBuild follows the __DEV__ flag", () => {
    devFlag.__DEV__ = true;
    expect(isDevelopmentBuild()).toBe(true);

    devFlag.__DEV__ = false;
    expect(isDevelopmentBuild()).toBe(false);
  });

  test("warns in development", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    devFlag.__DEV__ = true;

    devWarn("careful");

    expect(spy).toHaveBeenCalledWith("careful");
  });

  test("stays silent in a release build", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    devFlag.__DEV__ = false;

    devWarn("careful");

    expect(spy).not.toHaveBeenCalled();
  });
});
