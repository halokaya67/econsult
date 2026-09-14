import { renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/providers";
import { useQuestions } from "./useQuestions";

describe("useQuestions", () => {
  test("returns no questions until the config arrives, then the practice's questions", async () => {
    const { result } = renderHook(() => useQuestions(), { wrapper: hookWrapper() });

    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toHaveLength(2));
  });

  test("returns no questions for a practice that configured none", async () => {
    const { result } = renderHook(() => useQuestions(), {
      wrapper: hookWrapper({ settings: { practiceId: "prc-0873" } }),
    });

    await waitFor(() => expect(result.current).toEqual([]));
  });
});
