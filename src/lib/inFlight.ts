// A plain module function, not a hook: the React Compiler bails out of any component or hook whose
// body holds a `try`/`finally`, so the flag that swallows a second call is cleared out here instead.
export async function runOnce(
  flag: { current: boolean },
  work: () => Promise<void>,
): Promise<void> {
  if (flag.current) return;
  flag.current = true;
  try {
    await work();
  } finally {
    flag.current = false;
  }
}
