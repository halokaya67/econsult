import {
  draftReducer,
  hasUnsentContent,
  initialDraft,
  isPhotoPreparing,
  readyPhoto,
  shouldGuardLeaving,
  type DraftState,
} from "./draft";

const PICKED = "file:///picked.jpg";
const SENT_SUBMISSION = { phase: "sent", econsultId: "ec-1", attachment: "none" } as const;
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
      { type: "photoPickStarted", pickId: "p1", uri: PICKED },
    );

    const next = draftReducer(filled, { type: "recipientSelected", recipientId: "ct-12" });

    expect(next.answers).toEqual({ q1: "a" });
    expect(next.message).toBe("Hi");
    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
  });

  test("a pick starts a preparing photo and hasUnsentContent becomes true", () => {
    const next = draftReducer(initialDraft, {
      type: "photoPickStarted",
      pickId: "p1",
      uri: PICKED,
    });

    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
    expect(isPhotoPreparing(next)).toBe(true);
    expect(hasUnsentContent(next)).toBe(true);
  });

  test("a ready result for the current pick replaces the preparing photo", () => {
    const preparing = draftReducer(initialDraft, {
      type: "photoPickStarted",
      pickId: "p1",
      uri: PICKED,
    });

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
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1", uri: PICKED }),
      { type: "photoPickStarted", pickId: "p2", uri: "file:///picked-2.jpg" },
    );

    const next = draftReducer(second, READY);

    expect(next).toBe(second);
  });

  test("a ready result after removal is ignored", () => {
    const removed = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1", uri: PICKED }),
      { type: "photoRemoved" },
    );

    const next = draftReducer(removed, READY);

    expect(next.photo).toBeNull();
  });

  test("removing the photo clears it", () => {
    const ready = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1", uri: PICKED }),
      READY,
    );

    const next = draftReducer(ready, { type: "photoRemoved" });

    expect(next.photo).toBeNull();
    expect(readyPhoto(next)).toBeNull();
  });

  test("submitStarted sets the idempotency key once and keeps it on retry", () => {
    const first = draftReducer(initialDraft, { type: "submitStarted", idempotencyKey: "k1" });
    const retry = draftReducer(first, { type: "submitStarted", idempotencyKey: "k2" });

    expect(first.submission).toEqual({ phase: "draft", idempotencyKey: "k1" });
    expect(retry.submission).toEqual({ phase: "draft", idempotencyKey: "k1" });
  });

  test("editing the payload after a failed send drops the key", () => {
    const failed: DraftState = {
      ...initialDraft,
      submission: { phase: "draft", idempotencyKey: "k1" },
    };

    const typed = draftReducer(failed, { type: "messageChanged", message: "Hi" });
    const answered = draftReducer(failed, { type: "answerChanged", questionId: "q1", value: "a" });
    const rerouted = draftReducer(failed, { type: "recipientSelected", recipientId: "ct-12" });

    expect(typed.submission).toEqual({ phase: "draft", idempotencyKey: null });
    expect(answered.submission).toEqual({ phase: "draft", idempotencyKey: null });
    expect(rerouted.submission).toEqual({ phase: "draft", idempotencyKey: null });
  });

  test("the send after an edit mints a new key", () => {
    const edited = draftReducer(
      { ...initialDraft, submission: { phase: "draft", idempotencyKey: "k1" } },
      { type: "messageChanged", message: "Hi" },
    );

    const next = draftReducer(edited, { type: "submitStarted", idempotencyKey: "k2" });

    expect(next.submission).toEqual({ phase: "draft", idempotencyKey: "k2" });
  });

  // Once the create has landed the key is gone with the draft phase, so an edit has none to retire.
  test("an edit once the e-consult exists leaves the sent submission untouched", () => {
    const created: DraftState = { ...initialDraft, submission: SENT_SUBMISSION };

    const next = draftReducer(created, { type: "messageChanged", message: "Hi" });

    expect(next.submission).toBe(created.submission);
  });

  test("econsultCreated and attachmentSettled record the outcome", () => {
    const created = draftReducer(initialDraft, { type: "econsultCreated", econsultId: "ec-1" });
    const settled = draftReducer(created, {
      type: "attachmentSettled",
      econsultId: "ec-1",
      attachment: "failed",
    });

    expect(created.submission).toEqual({ phase: "sent", econsultId: "ec-1", attachment: "none" });
    expect(settled.submission).toEqual({ phase: "sent", econsultId: "ec-1", attachment: "failed" });
  });
});

describe("selectors", () => {
  test("hasUnsentContent ignores whitespace-only messages", () => {
    const state: DraftState = { ...initialDraft, message: "   " };

    expect(hasUnsentContent(state)).toBe(false);
  });

  test("shouldGuardLeaving is true only for unsent content before the e-consult exists", () => {
    const typed: DraftState = { ...initialDraft, message: "Hi" };
    const created: DraftState = { ...typed, submission: SENT_SUBMISSION };

    expect(shouldGuardLeaving(initialDraft)).toBe(false);
    expect(shouldGuardLeaving(typed)).toBe(true);
    expect(shouldGuardLeaving(created)).toBe(false);
  });

  test("shouldGuardLeaving is true once a recipient is chosen, with nothing else entered", () => {
    const chosen: DraftState = { ...initialDraft, recipientId: "ct-11" };

    expect(shouldGuardLeaving(chosen)).toBe(true);
  });

  test("shouldGuardLeaving is false for an empty draft", () => {
    expect(shouldGuardLeaving(initialDraft)).toBe(false);
  });

  test("shouldGuardLeaving is false once the e-consult exists, even with a recipient", () => {
    const sent: DraftState = { ...initialDraft, recipientId: "ct-11", submission: SENT_SUBMISSION };

    expect(shouldGuardLeaving(sent)).toBe(false);
  });
});
