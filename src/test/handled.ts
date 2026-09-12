/**
 * Marks a promise expected to reject as handled the moment the work starts.
 *
 * Jest fails a test on an unhandled rejection, and fake timers settle these promises before the
 * assertion attaches, so the rejection needs a catcher before the timers run.
 */
export function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}
