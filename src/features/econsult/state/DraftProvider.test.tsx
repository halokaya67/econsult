import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { deletedPhotoUris, failNextPhotoDelete, forgetDeletedPhotos } from "@/test/photoFiles";
import { initialDraft, type DraftAction, type DraftState } from "./draft";
import { DraftProvider, useDraft } from "./DraftProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <DraftProvider>{children}</DraftProvider>
);

const FIRST_PICK = "file:///cache/ImagePicker/first.jpg";
const FIRST_PROCESSED = "file:///cache/first-1600.jpg";
const SECOND_PICK = "file:///cache/ImagePicker/second.jpg";
const SECOND_PROCESSED = "file:///cache/second-1600.jpg";

function pick(dispatch: (action: DraftAction) => void, pickId: string, uris: [string, string]) {
  const [uri, processed] = uris;
  act(() => {
    dispatch({ type: "photoPickStarted", pickId, uri });
    dispatch({ type: "photoReady", pickId, uri: processed, width: 1600, height: 1200 });
  });
}

describe("DraftProvider", () => {
  beforeEach(forgetDeletedPhotos);

  test("starts from the initial draft and applies actions", () => {
    const { result } = renderHook(() => useDraft(), { wrapper });

    expect(result.current.draft).toEqual(initialDraft);

    act(() => result.current.dispatch({ type: "messageChanged", message: "Hi" }));

    expect(result.current.draft.message).toBe("Hi");
  });

  test("accepts an initial draft", () => {
    const initial = { ...initialDraft, recipientId: "ct-11" };
    const { result } = renderHook(() => useDraft(), {
      wrapper: ({ children }) => <DraftProvider initial={initial}>{children}</DraftProvider>,
    });

    expect(result.current.draft.recipientId).toBe("ct-11");
  });

  test("useDraft throws outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useDraft())).toThrow(/DraftProvider/);

    silence.mockRestore();
  });

  test("deletes every photo file the draft named, replaced ones included, when the flow ends", () => {
    const { result, unmount } = renderHook(() => useDraft(), { wrapper });
    pick(result.current.dispatch, "p1", [FIRST_PICK, FIRST_PROCESSED]);
    pick(result.current.dispatch, "p2", [SECOND_PICK, SECOND_PROCESSED]);

    expect(deletedPhotoUris()).toEqual([]);

    unmount();

    expect(deletedPhotoUris()).toEqual([
      FIRST_PICK,
      FIRST_PROCESSED,
      SECOND_PICK,
      SECOND_PROCESSED,
    ]);
  });

  test("deletes a photo the draft was handed before it was mounted", () => {
    const initial: DraftState = {
      ...initialDraft,
      photo: { status: "ready", pickId: "p1", uri: FIRST_PROCESSED, width: 10, height: 10 },
    };
    const { unmount } = renderHook(() => useDraft(), {
      wrapper: ({ children }) => <DraftProvider initial={initial}>{children}</DraftProvider>,
    });

    unmount();

    expect(deletedPhotoUris()).toEqual([FIRST_PROCESSED]);
  });

  test("a photo file that cannot be deleted is warned about and costs the patient nothing", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    failNextPhotoDelete("File does not exist");
    const { result, unmount } = renderHook(() => useDraft(), { wrapper });
    pick(result.current.dispatch, "p1", [FIRST_PICK, FIRST_PROCESSED]);

    expect(() => unmount()).not.toThrow();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("File does not exist"));
    expect(deletedPhotoUris()).toEqual([FIRST_PROCESSED]);
    warn.mockRestore();
  });
});
