const DEMO_MODE_KEY = "ps-demo-mode";

export const DEMO_USER_LABEL = "Sanvi";

export function isDemoModeActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_KEY) === "1";
}

export function setDemoModeActive(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    window.localStorage.setItem(DEMO_MODE_KEY, "1");
  } else {
    window.localStorage.removeItem(DEMO_MODE_KEY);
  }
}

export function clearDemoMode(): void {
  setDemoModeActive(false);
}
