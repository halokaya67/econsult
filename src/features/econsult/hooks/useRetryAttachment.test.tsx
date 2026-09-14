import { onlineManager } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/renderWithProviders";
import { useRetryAttachment } from "./useRetryAttachment";

const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

// NetworkProvider drives the shared onlineManager, so a forced-offline render must not leak.
afterEach(() => onlineManager.setOnline(true));

describe("useRetryAttachment", () => {
  test("resolves failed for an e-consult the transport does not know", async () => {
    const { result } = renderHook(() => useRetryAttachment(), {
      wrapper: hookWrapper(),
    });

    let status;
    await act(async () => {
      status = await result.current.mutateAsync({ econsultId: "ec-missing", photo: PHOTO });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(status).toBe("failed");
  });
});
