import {
  draftReducer,
  hasUnsentContent,
  initialDraft,
  isPhotoPreparing,
  readyPhoto,
  shouldGuardLeaving,
  type DraftState,
} from "./draft";

const READY = {
  type: "photoReady",
  pickId: "p1",
  uri: "file:///a.jpg",
  width: 100,
  height: 80,
} as const;

describe("draftReducer", () => {
  test("selects a recipient without mutating the previous state", () => {
    const next = draftReducer(initialDraft, { type: "recipientSelected", recipientId: "ct-11" });

    expect(next.recipientId).toBe("ct-11");
    expect(initialDraft.recipientId).toBeNull();
    expect(next).not.toBe(initialDraft);
  });

  test("stores an answer per question and keeps the others", () => {
    const one = draftReducer(initialDraft, { type: "answerChanged", questionId: "q1", value: "a" });
    const two = draftReducer(one, { type: "answerChanged", questionId: "q2", value: "b" });

    expect(two.answers).toEqual({ q1: "a", q2: "b" });
    expect(one.answers).toEqual({ q1: "a" });
  });

  test("changing the recipient keeps the answers, message and photo", () => {
    const filled = draftReducer(
      draftReducer(
        draftReducer(initialDraft, { type: "answerChanged", questionId: "q1", value: "a" }),
        { type: "messageChanged", message: "Hi" },
      ),
      { type: "photoPickStarted", pickId: "p1" },
    );

    const next = draftReducer(filled, { type: "recipientSelected", recipientId: "ct-12" });

    expect(next.answers).toEqual({ q1: "a" });
    expect(next.message).toBe("Hi");
    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
  });

  test("a pick starts a preparing photo and hasUnsentContent becomes true", () => {
    const next = draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" });

    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
    expect(isPhotoPreparing(next)).toBe(true);
    expect(hasUnsentContent(next)).toBe(true);
  });

  test("a ready result for the current pick replaces the preparing photo", () => {
    const preparing = draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" });

    const next = draftReducer(preparing, READY);

    expect(next.photo).toEqual({
      status: "ready",
      pickId: "p1",
      uri: "file:///a.jpg",
      width: 100,
      height: 80,
    });
    expect(readyPhoto(next)?.uri).toBe("file:///a.jpg");
  });

  test("a ready result for a superseded pick is ignored", () => {
    const second = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      { type: "photoPickStarted", pickId: "p2" },
    );

    const next = draftReducer(second, READY);

    expect(next).toBe(second);
  });

  test("a ready result after removal is ignored", () => {
    const removed = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      { type: "photoRemoved" },
    );

    const next = draftReducer(removed, READY);

    expect(next.photo).toBeNull();
  });

  test("removing the photo clears it", () => {
    const ready = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      READY,
    );

    const next = draftReducer(ready, { type: "photoRemoved" });

    expect(next.photo).toBeNull();
    expect(readyPhoto(next)).toBeNull();
  });

  test("submitStarted sets the idempotency key once and keeps it on retry", () => {
    const first = draftReducer(initialDraft, { type: "submitStarted", idempotencyKey: "k1" });
    const retry = draftReducer(first, { type: "submitStarted", idempotencyKey: "k2" });

    expect(first.idempotencyKey).toBe("k1");
    expect(retry.idempotencyKey).toBe("k1");
  });

  test("econsultCreated and attachmentSettled record the outcome", () => {
    const created = draftReducer(initialDraft, { type: "econsultCreated", econsultId: "ec-1" });
    const settled = draftReducer(created, { type: "attachmentSettled", attachment: "failed" });

    expect(settled.econsultId).toBe("ec-1");
    expect(settled.attachment).toBe("failed");
  });
});

describe("selectors", () => {
  test("hasUnsentContent ignores whitespace-only messages", () => {
    const state: DraftState = { ...initialDraft, message: "   " };

    expect(hasUnsentContent(state)).toBe(false);
  });

  test("shouldGuardLeaving is true only for unsent content before the e-consult exists", () => {
    const typed: DraftState = { ...initialDraft, message: "Hi" };
    const created: DraftState = { ...typed, econsultId: "ec-1" };

    expect(shouldGuardLeaving(initialDraft)).toBe(false);
    expect(shouldGuardLeaving(typed)).toBe(true);
    expect(shouldGuardLeaving(created)).toBe(false);
  });
});
