import { IDEMPOTENCY_HEADER } from "../contracts";
import { ApiError } from "../transport";
import { createFakeTransport, DEFAULT_LATENCY_MS } from "./fakeTransport";

const signal = () => new AbortController().signal;
const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };
const key = (value: string) => ({ [IDEMPOTENCY_HEADER]: value });

// Jest fails a test on an unhandled rejection, and fake timers settle these requests before the
// assertion attaches, so every promise expected to reject is marked handled when it starts.
function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}

describe("createFakeTransport", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("returns the practice config after the default config latency", async () => {
    const transport = createFakeTransport();

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS.config);

    await expect(pending).resolves.toMatchObject({ practiceId: "prc-0421" });
  });

  test("returns the care team after the default care-team latency", async () => {
    const transport = createFakeTransport();

    const pending = transport.getJson("/practices/prc-0873/care-team", signal());
    await jest.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS.careTeam);

    await expect(pending).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ct-44" })]),
    );
  });

  test("a latency override applies to every request", async () => {
    const transport = createFakeTransport({ latencyMs: 5000 });

    const pending = transport.getJson("/practices/prc-0421/care-team", signal());
    await jest.advanceTimersByTimeAsync(4999);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBeDefined();
  });

  test("an unknown practice is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = handled(transport.getJson("/practices/prc-9999/econsult-config", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an unknown practice's care team is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = handled(transport.getJson("/practices/prc-9999/care-team", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an unknown path is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = handled(transport.getJson("/nope", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("a network fault rejects with a network ApiError", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { config: "network" } });

    const pending = handled(transport.getJson("/practices/prc-0421/econsult-config", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "network" });
  });

  test("a server fault rejects with a 500 server ApiError", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { careTeam: "server" } });

    const pending = handled(transport.getJson("/practices/prc-0421/care-team", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 500 });
  });

  test("a timeout fault never resolves and rejects with AbortError once the signal aborts", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { create: "timeout" } });
    const controller = new AbortController();

    const pending = handled(transport.postJson("/econsults", {}, key("k"), controller.signal));
    await jest.advanceTimersByTimeAsync(60_000);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("aborting during latency rejects with AbortError", async () => {
    const transport = createFakeTransport();
    const controller = new AbortController();

    const pending = handled(
      transport.getJson("/practices/prc-0421/econsult-config", controller.signal),
    );
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("creating an e-consult returns an id and repeating the idempotency key returns the same id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const body = { patientId: "p", recipientId: "ct-11", body: "Hi", answers: [] };

    const first = transport.postJson("/econsults", body, key("k1"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const second = transport.postJson("/econsults", body, key("k1"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const third = transport.postJson("/econsults", body, key("k2"), signal());
    await jest.advanceTimersByTimeAsync(0);

    const [a, b, c] = (await Promise.all([first, second, third])) as { econsultId: string }[];
    expect(a.econsultId).toMatch(/^ec-/);
    expect(b.econsultId).toBe(a.econsultId);
    expect(c.econsultId).not.toBe(a.econsultId);
  });

  test("creating without an idempotency key is a 400 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = handled(transport.postJson("/econsults", {}, {}, signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 400 });
  });

  test("uploading to an existing e-consult returns an attachment id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const created = transport.postJson("/econsults", {}, key("k"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = (await created) as { econsultId: string };

    const pending = transport.uploadPhoto(`/econsults/${econsultId}/attachments`, PHOTO, signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ attachmentId: expect.stringMatching(/^att-/) });
  });

  test("uploading to an unknown e-consult is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = handled(
      transport.uploadPhoto("/econsults/ec-missing/attachments", PHOTO, signal()),
    );
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an upload fault applies only to the upload request", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { upload: "server" } });

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toBeDefined();
  });

  test("a request started with an already-aborted signal rejects at once", async () => {
    const transport = createFakeTransport();
    const controller = new AbortController();
    controller.abort();

    await expect(
      transport.getJson("/practices/prc-0421/care-team", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    const hanging = createFakeTransport({ faults: { config: "timeout" } });
    await expect(
      hanging.getJson("/practices/prc-0421/econsult-config", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  test("posting or uploading to an unknown path is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    await expect(transport.postJson("/nope", {}, key("k"), signal())).rejects.toMatchObject({
      kind: "server",
      status: 404,
    });
    await expect(transport.uploadPhoto("/nope", PHOTO, signal())).rejects.toMatchObject({
      kind: "server",
      status: 404,
    });
  });

  test("errors are ApiError instances", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { config: "server" } });

    const pending = handled(transport.getJson("/practices/prc-0421/econsult-config", signal()));
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });
});
