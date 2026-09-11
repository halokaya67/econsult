// The one __DEV__ read in the app: screens branch on this function so tests can stub it.
export function isDevelopmentBuild(): boolean {
  return __DEV__;
}

export function devWarn(message: string): void {
  if (!isDevelopmentBuild()) return;
  console.warn(message);
}
