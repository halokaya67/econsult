import { renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/renderWithProviders";
import { useRecipients } from "./useRecipients";

describe("useRecipients", () => {
  test("goes from loading to ready with the fixture practice", async () => {
    const { result } = renderHook(() => useRecipients(), { wrapper: hookWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    if (result.current.status === "ready") {
      expect(result.current.recipients.map((r) => r.id)).toEqual(["ct-11", "ct-12", "ct-19"]);
      expect(result.current.questions).toHaveLength(2);
    }
  });

  test("reports an error when the config request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { config: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports an error when the care team request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { careTeam: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports empty for a practice without recipients", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { practiceId: "prc-0000" } }),
    });

    await waitFor(() => expect(result.current.status).toBe("empty"));
  });
});
