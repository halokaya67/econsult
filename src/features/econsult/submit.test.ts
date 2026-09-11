import { createFakeTransport } from "@/api/fake/fakeTransport";
import { createServices, type Services } from "@/api/services";
import {
  retryAttachment,
  submitEConsult,
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

  test("an unexpected upload error is not swallowed into a failed attachment", async () => {
    const broken: Services = {
      ...services(),
      uploadAttachment: async () => {
        throw new TypeError("bug");
      },
    };

    await expect(submitEConsult(broken, input({ photo: PHOTO }), jest.fn())).rejects.toBeInstanceOf(
      TypeError,
    );
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
});
