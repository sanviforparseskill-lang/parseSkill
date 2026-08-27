export function ConfidenceBar({ value, showLabel = true, size = "sm" }: { value: number; showLabel?: boolean; size?: "sm" | "md" }) {
  const pct = Math.round(value * 100);
  const h = size === "md" ? "h-1.5" : "h-1";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`relative flex-1 ${h} bg-secondary rounded-full overflow-hidden`}>
        <div className="absolute inset-y-0 left-0 bg-proof rounded-full" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] leading-none text-ink-muted tabular-nums w-9 text-right">
          {pct}%
        </span>
      )}
    </div>
  );
}
