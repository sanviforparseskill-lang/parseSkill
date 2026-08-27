import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function Receipt({
  title, items, stamp = "VERIFIED", className, children, animate = true,
}: {
  title: string;
  items?: { label: string; value: string }[];
  stamp?: string;
  className?: string;
  children?: ReactNode;
  animate?: boolean;
}) {
  const [mounted, setMounted] = useState(!animate);
  useEffect(() => { if (animate) setMounted(true); }, [animate]);

  return (
    <div
      className={cn(
        "relative bg-surface border border-line receipt-edge shadow-[0_1px_0_0_var(--color-line)] pt-4 pb-4 px-4",
        animate && mounted && "receipt-unfurl",
        className,
      )}
      style={{ paddingTop: "18px" }}
    >
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-dashed border-line">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Receipt</div>
          <h3 className="font-mono text-[13px] text-ink truncate mt-0.5">{title}</h3>
        </div>
        <div className="shrink-0 flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          {stamp}
        </div>
      </div>

      {items && (
        <ul className="pt-3 space-y-1.5 font-mono text-[12px] text-ink">
          {items.map((it, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4">
              <span className="text-ink-muted">{it.label}</span>
              <span className="text-right break-all">{it.value}</span>
            </li>
          ))}
        </ul>
      )}

      {children && <div className="pt-3 text-[13px] text-ink">{children}</div>}

      <div className="mt-3 pt-3 border-t border-dashed border-line font-mono text-[10px] text-ink-muted flex justify-between">
        <span>parseSkill();</span>
        <span>ts:{new Date().toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}
