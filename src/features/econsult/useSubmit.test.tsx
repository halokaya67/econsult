import { act, renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/providers";
import { useRetryAttachment, useSubmit } from "./useSubmit";

const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

const INPUT = {
  session: { patientId: "pat-1", practiceId: "prc-0421", displayName: "Ria" },
  recipientId: "ct-11",
  message: "My knee hurts",
  answers: {},
  photo: PHOTO,
  idempotencyKey: "key-1",
};

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

    expect(outcome).toEqual({ econsultId: expect.any(String), attachment: "attached" });
    expect(onCreated).toHaveBeenCalled();
  });

  test("exposes the error when the create fails instead of pausing", async () => {
    const { result } = renderHook(() => useSubmit(jest.fn()), {
      wrapper: hookWrapper({ settings: { faults: { create: "server" } } }),
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: "server" });
  });
});

describe("useRetryAttachment", () => {
  test("resolves failed for an e-consult the transport does not know", async () => {
    const { result } = renderHook(() => useRetryAttachment(), {
      wrapper: hookWrapper(),
    });

    let status;
    await act(async () => {
      status = await result.current.mutateAsync({ econsultId: "ec-missing", photo: PHOTO });
    });

    expect(status).toBe("failed");
  });
});
