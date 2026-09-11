export type ApiErrorKind = "network" | "server" | "timeout" | "validation";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type PhotoFile = { uri: string; name: string; type: string };

export interface Transport {
  getJson(path: string, signal: AbortSignal): Promise<unknown>;
  postJson(
    path: string,
    body: unknown,
    headers: Record<string, string>,
    signal: AbortSignal,
  ): Promise<unknown>;
  uploadPhoto(path: string, photo: PhotoFile, signal: AbortSignal): Promise<unknown>;
}

// AbortController + setTimeout rather than AbortSignal.timeout: Expo's runtime patches the latter in, but it
// aborts with a TimeoutError reason. The catch decides on the signal, not the error's shape, because a real
// client surfaces an abort as an AbortError or a cause-less FetchError depending on timing.
export async function withTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted)
      throw new ApiError("timeout", `The request took longer than ${ms} ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
