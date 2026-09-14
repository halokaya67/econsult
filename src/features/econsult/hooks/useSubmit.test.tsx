import { onlineManager } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/renderWithProviders";
import { useSubmit } from "./useSubmit";

const INPUT = {
  session: { patientId: "pat-1", practiceId: "prc-0421", displayName: "Ria" },
  recipientId: "ct-11",
  message: "My knee hurts",
  answers: {},
  photo: { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" },
  idempotencyKey: "key-1",
};

// NetworkProvider drives the shared onlineManager, so a forced-offline render must not leak.
afterEach(() => onlineManager.setOnline(true));

describe("useSubmit", () => {
  test("resolves the outcome and reports the created id", async () => {
    const onCreated = jest.fn();
    const { result } = renderHook(() => useSubmit(onCreated), {
      wrapper: hookWrapper(),
    });

    let outcome;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(outcome).toEqual({ econsultId: expect.any(String), attachment: "attached" });
    expect(onCreated).toHaveBeenCalled();
  });

  test("runs offline and exposes the failed create instead of pausing the send", async () => {
    const { result } = renderHook(() => useSubmit(jest.fn()), {
      wrapper: hookWrapper({ settings: { forceOffline: true, faults: { create: "server" } } }),
    });
    expect(onlineManager.isOnline()).toBe(false);

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isPaused).toBe(false);
    expect(result.current.error).toMatchObject({ kind: "server" });
  });
});
