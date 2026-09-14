import { createFakeTransport } from "@/api/fake/fakeTransport";
import { createServices, type Services } from "@/api/services";
import { initialDraft, type DraftState } from "../state/draft";
import {
  idempotencyKeyFor,
  retryAttachment,
  submitEConsult,
  submitInputFor,
  toAnswers,
  toCreateRequest,
  type SubmitInput,
} from "./submit";

const SESSION = { patientId: "pat-1", practiceId: "prc-0421", displayName: "Ria" };
const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

function input(overrides: Partial<SubmitInput> = {}): SubmitInput {
  return {
    session: SESSION,
    recipientId: "ct-11",
    message: "  My knee hurts  ",
    answers: { "q-duration": "1 to 4 weeks", "q-medication": "  " },
    photo: null,
    idempotencyKey: "key-1",
    ...overrides,
  };
}

const DRAFT: DraftState = {
  ...initialDraft,
  recipientId: "ct-11",
  message: "My knee hurts",
  answers: { "q-duration": "1 to 4 weeks" },
};
const READY_PHOTO = {
  status: "ready",
  pickId: "p1",
  uri: "file:///cache/p.jpg",
  width: 10,
  height: 10,
} as const;

// Stands in for a bug in the upload path: not an ApiError, so it is not a photo outcome.
function broken(): Services {
  return {
    ...createServices(createFakeTransport({ latencyMs: 0 })),
    uploadAttachment: async () => {
      throw new TypeError("bug");
    },
  };
}

describe("idempotencyKeyFor", () => {
  test("reuses the key the draft already carries", () => {
    expect(idempotencyKeyFor({ ...DRAFT, idempotencyKey: "key-9" })).toBe("key-9");
  });

  test("allocates a fresh key for a draft that has never been sent", () => {
    const first = idempotencyKeyFor(DRAFT);

    expect(first).toEqual(expect.any(String));
    expect(idempotencyKeyFor(DRAFT)).not.toBe(first);
  });
});

describe("submitInputFor", () => {
  test("maps the draft and the session onto the send input", () => {
    expect(submitInputFor(DRAFT, SESSION, "ct-11", "key-1")).toEqual({
      session: SESSION,
      recipientId: "ct-11",
      message: "My knee hurts",
      answers: { "q-duration": "1 to 4 weeks" },
      photo: null,
      idempotencyKey: "key-1",
    });
  });

  test("sends a ready photo as a file and a photo still preparing as none", () => {
    const ready = submitInputFor({ ...DRAFT, photo: READY_PHOTO }, SESSION, "ct-11", "key-1");
    const preparing = submitInputFor(
      { ...DRAFT, photo: { status: "preparing", pickId: "p2" } },
      SESSION,
      "ct-11",
      "key-1",
    );

    expect(ready.photo).toEqual({ uri: READY_PHOTO.uri, name: "photo.jpg", type: "image/jpeg" });
    expect(preparing.photo).toBeNull();
  });
});

describe("toAnswers and toCreateRequest", () => {
  test("drops blank answers and trims the rest", () => {
    expect(toAnswers({ a: " x ", b: "   " })).toEqual([{ questionId: "a", value: "x" }]);
  });

  test("builds the wire request from the session and the draft", () => {
    expect(toCreateRequest(input())).toEqual({
      patientId: "pat-1",
      recipientId: "ct-11",
      body: "My knee hurts",
      answers: [{ questionId: "q-duration", value: "1 to 4 weeks" }],
    });
  });
});

describe("submitEConsult", () => {
  const services = () => createServices(createFakeTransport({ latencyMs: 0 }));

  test("creates the e-consult and reports no attachment when there is no photo", async () => {
    const onCreated = jest.fn();

    const outcome = await submitEConsult(services(), input(), onCreated);

    expect(outcome).toEqual({ econsultId: expect.stringMatching(/^ec-/), attachment: "none" });
    expect(onCreated).toHaveBeenCalledWith(outcome.econsultId);
  });

  test("uploads the photo after creating and reports it attached", async () => {
    const outcome = await submitEConsult(services(), input({ photo: PHOTO }), jest.fn());

    expect(outcome.attachment).toBe("attached");
  });

  test("reports the partial failure when the upload fails after a successful create", async () => {
    const failing = createServices(
      createFakeTransport({ latencyMs: 0, faults: { upload: "server" } }),
    );
    const onCreated = jest.fn();

    const outcome = await submitEConsult(failing, input({ photo: PHOTO }), onCreated);

    expect(outcome.attachment).toBe("failed");
    expect(onCreated).toHaveBeenCalledWith(outcome.econsultId);
  });

  test("rejects when the create fails and never reports a creation", async () => {
    const failing = createServices(
      createFakeTransport({ latencyMs: 0, faults: { create: "network" } }),
    );
    const onCreated = jest.fn();

    await expect(submitEConsult(failing, input(), onCreated)).rejects.toMatchObject({
      kind: "network",
    });
    expect(onCreated).not.toHaveBeenCalled();
  });

  test("a retry with the same idempotency key yields the same e-consult id", async () => {
    const shared = services();

    const first = await submitEConsult(shared, input(), jest.fn());
    const second = await submitEConsult(shared, input(), jest.fn());

    expect(second.econsultId).toBe(first.econsultId);
  });

  test("an unexpected upload error is the partial outcome, because the message was created", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const onCreated = jest.fn();

    const outcome = await submitEConsult(broken(), input({ photo: PHOTO }), onCreated);

    expect(outcome).toEqual({ econsultId: expect.stringMatching(/^ec-/), attachment: "failed" });
    expect(onCreated).toHaveBeenCalledWith(outcome.econsultId);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bug"));
    warn.mockRestore();
  });
});

describe("retryAttachment", () => {
  test("returns attached when the upload succeeds", async () => {
    const shared = createServices(createFakeTransport({ latencyMs: 0 }));
    const { econsultId } = await submitEConsult(shared, input(), jest.fn());

    await expect(retryAttachment(shared, econsultId, PHOTO)).resolves.toBe("attached");
  });

  test("returns failed when the upload fails with an API error", async () => {
    const failing = createServices(
      createFakeTransport({ latencyMs: 0, faults: { upload: "network" } }),
    );
    const { econsultId } = await submitEConsult(failing, input(), jest.fn());

    await expect(retryAttachment(failing, econsultId, PHOTO)).resolves.toBe("failed");
  });

  test("does not swallow an unexpected error into a failed attachment", async () => {
    await expect(retryAttachment(broken(), "ec-1", PHOTO)).rejects.toBeInstanceOf(TypeError);
  });
});
