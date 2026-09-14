import { handled } from "@/test/handled";
import { IDEMPOTENCY_HEADER } from "./contracts";
import { createFakeTransport } from "./fake/fakeTransport";
import { createServices, READ_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from "./services";
import type { Transport } from "./transport";

const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };
const REQUEST = { patientId: "pat-1", recipientId: "ct-11", body: "My knee hurts", answers: [] };
// The documented create budget, spelled out rather than imported: sharing the read constant would
// let a change to the read budget move the create budget unnoticed.
const CREATE_BUDGET_MS = 15_000;

function malformedTransport(payload: unknown): Transport {
  return {
    getJson: async () => payload,
    postJson: async () => payload,
    uploadPhoto: async () => payload,
  };
}

describe("createServices", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("getPracticeConfig returns a parsed config", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));

    const pending = services.getPracticeConfig("prc-0421");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ practiceId: "prc-0421" });
  });

  test("getCareTeam returns parsed members with roles", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));

    const pending = services.getCareTeam("prc-0421");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ct-11", role: "gp" })]),
    );
  });

  test("createEConsult sends the idempotency key and returns the id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const spy = jest.spyOn(transport, "postJson");
    const services = createServices(transport);

    const pending = services.createEConsult(REQUEST, "key-1");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ econsultId: expect.stringMatching(/^ec-/) });
    expect(spy).toHaveBeenCalledWith(
      "/econsults",
      REQUEST,
      { [IDEMPOTENCY_HEADER]: "key-1" },
      expect.any(AbortSignal),
    );
  });

  test("uploadAttachment posts the photo to the e-consult and returns the attachment id", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));
    const created = services.createEConsult(REQUEST, "key-2");
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = await created;

    const pending = services.uploadAttachment(econsultId, PHOTO);
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ attachmentId: expect.stringMatching(/^att-/) });
  });

  test("a malformed config payload is a validation ApiError", async () => {
    const services = createServices(malformedTransport({ practiceId: 1 }));

    await expect(services.getPracticeConfig("prc-0421")).rejects.toMatchObject({
      kind: "validation",
    });
  });

  test("a malformed create response is a validation ApiError", async () => {
    const services = createServices(malformedTransport({ nope: true }));

    await expect(services.createEConsult(REQUEST, "k")).rejects.toMatchObject({
      kind: "validation",
    });
  });

  test("a read that exceeds the read timeout is a timeout ApiError", async () => {
    const services = createServices(createFakeTransport({ faults: { config: "timeout" } }));

    const pending = handled(services.getPracticeConfig("prc-0421"));
    await jest.advanceTimersByTimeAsync(READ_TIMEOUT_MS);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("a create that hangs is aborted at the 15 second create budget", async () => {
    const services = createServices(createFakeTransport({ faults: { create: "timeout" } }));
    const startedAt = Date.now();
    const rejectedAfter = jest.fn();
    const pending = handled(
      services.createEConsult(REQUEST, "key-timeout").catch((error: unknown) => {
        rejectedAfter(Date.now() - startedAt);
        throw error;
      }),
    );

    await jest.advanceTimersByTimeAsync(CREATE_BUDGET_MS * 2);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
    expect(rejectedAfter).toHaveBeenCalledWith(CREATE_BUDGET_MS);
  });

  test("an upload that exceeds the upload timeout is a timeout ApiError", async () => {
    const services = createServices(
      createFakeTransport({ latencyMs: 0, faults: { upload: "timeout" } }),
    );
    const created = services.createEConsult(REQUEST, "key-3");
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = await created;

    const pending = handled(services.uploadAttachment(econsultId, PHOTO));
    await jest.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("a server fault surfaces as a server ApiError", async () => {
    const services = createServices(
      createFakeTransport({ latencyMs: 0, faults: { careTeam: "server" } }),
    );

    const pending = handled(services.getCareTeam("prc-0421"));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 500 });
  });
});
