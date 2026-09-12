import { ApiError } from "@/api/transport";
import { sendErrorCopy } from "./errorCopy";

describe("sendErrorCopy", () => {
  test.each([
    ["timeout", "Sending took too long. Check your connection and try again."],
    ["network", "We couldn't reach your practice. Check your connection and try again."],
    ["server", "Something went wrong at our end. Please try again."],
    ["validation", "Something went wrong at our end. Please try again."],
  ] as const)("%s -> plain-language copy", (kind, copy) => {
    expect(sendErrorCopy(new ApiError(kind, "x"))).toBe(copy);
  });

  test("an unknown error gets the generic copy", () => {
    expect(sendErrorCopy(new Error("bug"))).toBe(
      "Something went wrong at our end. Please try again.",
    );
  });
});
