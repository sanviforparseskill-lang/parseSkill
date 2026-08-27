import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRolePredictions, useRoadmap, useSetRoadmapStatus } from "@/lib/queries";

export const Route = createFileRoute("/_app/roadmap")({ component: RoadmapPage });

const STATUS_LABEL: Record<string, string> = { not_started: "Todo", learning: "Learning", done: "Done" };

function RoadmapPage() {
  const { data: roles } = useRolePredictions();
  const [roleId, setRoleId] = useState<string | null>(null);

  useEffect(() => {
    if (!roleId && roles && roles.length > 0) setRoleId(roles[0].role_id);
  }, [roles, roleId]);

  const { data: items } = useRoadmap(roleId);
  const setStatus = useSetRoadmapStatus();
  const role = roles?.find((r) => r.role_id === roleId);
  const list = items ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">roadmap</div>
          <h1 className="text-[28px] font-semibold mt-0.5">
            Learning path to {role?.role_name ?? "…"}
          </h1>
          <p className="text-[14px] text-ink-muted mt-1">Prerequisite-aware skill ordering for your target role.</p>
        </div>
        <select
          value={roleId ?? ""}
          onChange={(e) => setRoleId(e.target.value)}
          className="h-9 border border-line rounded bg-surface px-2 font-mono text-[12px]"
        >
          {(roles ?? []).map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="mt-8 text-[13.5px] text-ink-muted">
          No roadmap steps available for this role yet — required-skill data for this role hasn't been curated.
        </p>
      ) : (
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {list.map((it) => (
            <div key={it.skill_id} className="border border-line bg-surface rounded-md p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-[13px] font-semibold">{it.skill_name}</div>
                <span className={`font-mono text-[10.5px] px-2 py-0.5 rounded border ${it.status === "learning" ? "border-signal text-signal" : it.status === "done" ? "border-proof text-proof" : "border-line text-ink-muted"}`}>
                  {STATUS_LABEL[it.status] ?? it.status}
                </span>
              </div>
              <p className="text-[13px] text-ink-muted mt-1">Estimated {it.estimated_hours}h</p>
              <div className="mt-3 flex gap-1.5">
                {(["not_started", "learning", "done"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={!roleId}
                    onClick={() => roleId && setStatus.mutate({ skillId: it.skill_id, roleId, status: s })}
                    className={`font-mono text-[10.5px] px-2 py-1 border rounded ${it.status === s ? "border-signal text-signal" : "border-line text-ink-muted hover:border-signal"}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
