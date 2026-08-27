import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScoreCard({
  label, value, trend, spark, onClick,
}: {
  label: string;
  value: number;
  trend: number;
  spark?: number[];
  onClick?: () => void;
}) {
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColor = trend > 0 ? "text-proof" : trend < 0 ? "text-gap" : "text-ink-muted";
  const max = spark ? Math.max(...spark) : 100;
  const min = spark ? Math.min(...spark) : 0;
  const range = Math.max(1, max - min);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{label}</span>
        <span className={cn("flex items-center gap-0.5 font-mono text-[11px]", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {trend > 0 ? "+" : ""}{trend}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display font-bold text-3xl text-ink tabular-nums">{value}</span>
        <span className="font-mono text-xs text-ink-muted">/100</span>
      </div>
      {spark && (
        <svg viewBox="0 0 100 24" className="mt-3 w-full h-6 overflow-visible" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="var(--proof)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            points={spark.map((v, i) => `${(i / (spark.length - 1)) * 100},${24 - ((v - min) / range) * 22}`).join(" ")}
          />
        </svg>
      )}
    </button>
  );
}
