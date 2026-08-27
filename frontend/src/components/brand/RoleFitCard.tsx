import { ConfidenceBar } from "./ConfidenceBar";
import type { RolePrediction } from "@/lib/types";

export function RoleFitCard({
  role, strengths = [], gaps = [], size = "md",
}: {
  role: RolePrediction;
  strengths?: string[];
  gaps?: string[];
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={size === "lg" ? "text-lg font-semibold" : "text-base font-semibold"}>
            {role.role_name}
          </h3>
        </div>
        <span className="font-mono text-lg font-bold text-proof tabular-nums">
          {Math.round(role.confidence * 100)}%
        </span>
      </div>
      <div className="mt-2">
        <ConfidenceBar value={role.confidence} showLabel={false} size="md" />
      </div>
      {size !== "sm" && role.description && (
        <p className="text-[13px] text-ink-muted mt-3">{role.description}</p>
      )}
      {(strengths.length > 0 || gaps.length > 0) && (
        <div className="mt-3 space-y-2">
          {strengths.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">Strengths</div>
              <div className="flex flex-wrap gap-1">
                {strengths.map((s) => (
                  <span key={s} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-proof/40 text-proof">{s}</span>
                ))}
              </div>
            </div>
          )}
          {gaps.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">Gaps</div>
              <div className="flex flex-wrap gap-1">
                {gaps.map((s) => (
                  <span key={s} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-gap/40 text-gap">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
