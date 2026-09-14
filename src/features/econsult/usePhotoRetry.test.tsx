import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { TestProviders } from "@/test/providers";
import { initialDraft, type DraftState } from "./draft";
import { DraftProvider } from "./DraftProvider";
import * as submitModule from "./submit";
import { usePhotoRetry } from "./usePhotoRetry";

const READY_PHOTO = {
  status: "ready",
  pickId: "p1",
  uri: "file:///cache/p.jpg",
  width: 10,
  height: 10,
} as const;
const SENT: DraftState = {
  ...initialDraft,
  recipientId: "ct-11",
  message: "Hi",
  econsultId: "ec-1",
  photo: READY_PHOTO,
  attachment: "failed",
};

function draftWrapper(draft: DraftState) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders>
        <DraftProvider initial={draft}>{children}</DraftProvider>
      </TestProviders>
    );
  };
}

describe("usePhotoRetry", () => {
  afterEach(() => jest.restoreAllMocks());

  test("ignores a second retry that lands inside the first one's tick", async () => {
    const upload = jest.spyOn(submitModule, "retryAttachment");
    const { result } = renderHook(() => usePhotoRetry(), { wrapper: draftWrapper(SENT) });

    // TanStack notifies observers on a macrotask, so the settle only lands inside act if the block
    // waits for a timer too.
    await act(async () => {
      result.current.start();
      result.current.start();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(upload).toHaveBeenCalledTimes(1);
  });

  test("uploads nothing when the draft no longer holds a ready photo", async () => {
    const upload = jest.spyOn(submitModule, "retryAttachment");
    const { result } = renderHook(() => usePhotoRetry(), {
      wrapper: draftWrapper({ ...SENT, photo: null }),
    });

    act(() => result.current.start());

    expect(upload).not.toHaveBeenCalled();
  });
});
