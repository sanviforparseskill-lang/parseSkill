import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SyncLine = { t?: string; text: string; tone?: "info" | "ok" | "warn" };

export function SyncLog({ lines, speed = 220, done = false, className }: {
  lines: SyncLine[]; speed?: number; done?: boolean; className?: string;
}) {
  const [shown, setShown] = useState<SyncLine[]>([]);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    setShown([]);
    let i = 0;
    const tick = () => {
      setShown((s) => (i < lines.length ? [...s, lines[i]] : s));
      i += 1;
      if (i <= lines.length) timer.current = window.setTimeout(tick, speed);
    };
    tick();
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [lines, speed]);

  return (
    <div
      className={cn(
        "font-mono text-[12px] leading-6 bg-[color-mix(in_oklab,var(--ink)_92%,transparent)] text-[#E7EAE6] rounded-md border border-line p-3 overflow-auto scrollbar-thin",
        className,
      )}
      role="log"
      aria-live="polite"
    >
      {shown.map((l, i) => (
        <div key={i} className="whitespace-pre">
          <span className="text-[color-mix(in_oklab,#E7EAE6_60%,transparent)]">
            {l.t ?? new Date().toLocaleTimeString([], { hour12: false })}
          </span>{" "}
          <span
            className={cn(
              l.tone === "ok" && "text-proof",
              l.tone === "warn" && "text-gap",
              !l.tone && "text-[#E7EAE6]",
            )}
          >
            {l.text}
          </span>
        </div>
      ))}
      {!done && shown.length >= lines.length ? null : (
        <div className="text-[color-mix(in_oklab,#E7EAE6_60%,transparent)]">
          <span className="cursor-blink-forever">▍</span>
        </div>
      )}
    </div>
  );
}
