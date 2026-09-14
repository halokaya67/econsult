import { isApiError } from "@/api/transport";

const TIMEOUT_COPY = "Sending took too long. Check your connection and try again.";
const NETWORK_COPY = "We couldn't reach your practice. Check your connection and try again.";
const GENERIC_COPY = "Something went wrong at our end. Please try again.";

// A server or validation failure is our problem, not something the patient can act on, so both
// get the same generic line; only the two connection kinds tell them what to try.
export function sendErrorCopy(error: unknown): string {
  if (!isApiError(error)) return GENERIC_COPY;
  if (error.kind === "timeout") return TIMEOUT_COPY;
  if (error.kind === "network") return NETWORK_COPY;
  return GENERIC_COPY;
}
