import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { initialDraft } from "./draft";
import { DraftProvider, useDraft } from "./DraftProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <DraftProvider>{children}</DraftProvider>
);

describe("DraftProvider", () => {
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
});
