import { IDEMPOTENCY_HEADER } from "../contracts";
import { ApiError, type PhotoFile, type Transport } from "../transport";
import { rawCareTeams, rawPractices } from "./fixtures";

export type RequestName = "config" | "careTeam" | "create" | "upload";
export type FaultKind = "network" | "server" | "timeout";
export type Faults = Partial<Record<RequestName, FaultKind>>;
export type FakeTransportOptions = { latencyMs?: number | null; faults?: Faults };
// What a server would keep: the e-consults created so far and the ids already handed out.
export type FakeState = {
  nextId: number;
  byIdempotencyKey: Map<string, string>;
  econsults: Set<string>;
};

export const REQUEST_NAMES: readonly RequestName[] = ["config", "careTeam", "create", "upload"];
export const FAULT_KINDS: readonly FaultKind[] = ["network", "server", "timeout"];
export const DEFAULT_LATENCY_MS: Record<RequestName, number> = {
  config: 2000,
  careTeam: 1000,
  create: 1000,
  upload: 1000,
};

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

const CONFIG_PATH = /^\/practices\/([^/]+)\/econsult-config$/;
const CARE_TEAM_PATH = /^\/practices\/([^/]+)\/care-team$/;
const CREATE_PATH = /^\/econsults$/;
const UPLOAD_PATH = /^\/econsults\/([^/]+)\/attachments$/;

function abortError(): Error {
  const error = new Error("The request was aborted");
  error.name = "AbortError";
  return error;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function hangUntilAborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) return reject(abortError());
    signal.addEventListener("abort", () => reject(abortError()), { once: true });
  });
}

function notFound(what: string): ApiError {
  return new ApiError("server", `${what} was not found`, HTTP_NOT_FOUND);
}

// A fresh state is an empty backend; one state shared by several transports is one backend the
// developer settings can be changed against.
export function createFakeState(): FakeState {
  return { nextId: 1, byIdempotencyKey: new Map(), econsults: new Set() };
}

function create(state: FakeState, headers: Record<string, string>): { econsultId: string } {
  const idempotencyKey = headers[IDEMPOTENCY_HEADER];
  if (!idempotencyKey) throw new ApiError("server", "Missing Idempotency-Key", HTTP_BAD_REQUEST);
  const existing = state.byIdempotencyKey.get(idempotencyKey);
  if (existing) return { econsultId: existing };
  const econsultId = `ec-${state.nextId}`;
  state.nextId += 1;
  state.byIdempotencyKey.set(idempotencyKey, econsultId);
  state.econsults.add(econsultId);
  return { econsultId };
}

// Latency and faults belong to the transport, the e-consults to the state handed in: a
// developer-settings change rebuilds the transport and must not lose what the patient has sent.
export function createFakeTransport(
  options: FakeTransportOptions = {},
  state: FakeState = createFakeState(),
): Transport {
  const faults = options.faults ?? {};

  async function simulate(name: RequestName, signal: AbortSignal): Promise<void> {
    const latency = options.latencyMs ?? DEFAULT_LATENCY_MS[name];
    const fault = faults[name];
    if (fault === "timeout") return hangUntilAborted(signal);
    await delay(latency, signal);
    if (fault === "network") throw new ApiError("network", "Could not reach the server");
    if (fault === "server")
      throw new ApiError("server", "The server had a problem", HTTP_SERVER_ERROR);
  }

  return {
    async getJson(path, signal) {
      const config = CONFIG_PATH.exec(path);
      if (config) {
        await simulate("config", signal);
        return rawPractices[config[1]] ?? Promise.reject(notFound("Practice"));
      }
      const team = CARE_TEAM_PATH.exec(path);
      if (team) {
        await simulate("careTeam", signal);
        return rawCareTeams[team[1]] ?? Promise.reject(notFound("Practice"));
      }
      throw notFound("Path");
    },
    async postJson(path, _body, headers, signal) {
      if (!CREATE_PATH.test(path)) throw notFound("Path");
      await simulate("create", signal);
      return create(state, headers);
    },
    async uploadPhoto(path, _photo: PhotoFile, signal) {
      const match = UPLOAD_PATH.exec(path);
      if (!match) throw notFound("Path");
      await simulate("upload", signal);
      if (!state.econsults.has(match[1])) throw notFound("E-consult");
      const attachmentId = `att-${state.nextId}`;
      state.nextId += 1;
      return { attachmentId };
    },
  };
}
