import { useEffect, useState } from "react";
import { clearDemoMode, isDemoModeActive } from "@/lib/demo-mode";

export function DemoModeBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoModeActive());
    const onStorage = () => setActive(isDemoModeActive());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!active) return null;

  const exitDemoMode = () => {
    clearDemoMode();
    window.location.href = "/auth/signin";
  };

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-[12.5px] text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <span>Demo Mode: showing data from local development, backend not deployed due to hosting memory limits</span>
        <button
          type="button"
          onClick={exitDemoMode}
          className="shrink-0 rounded border border-amber-500 px-2 py-0.5 font-mono text-[11px] text-amber-900 hover:bg-amber-200"
        >
          Exit demo mode
        </button>
      </div>
    </div>
  );
}
