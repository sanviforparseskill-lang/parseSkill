import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTimeline } from "@/lib/queries";
import { colorForCategory } from "@/lib/category-colors";

export const Route = createFileRoute("/_app/timeline")({ component: TimelinePage });

function TimelinePage() {
  const { data } = useTimeline();
  const cells = useMemo(() => data?.cells ?? [], [data]);
  const milestones = data?.milestones ?? [];
  const velocity = data?.learning_velocity ?? [];

  const quarters = useMemo(
    () => Array.from(new Set(cells.map((c) => c.quarter))).sort(),
    [cells],
  );

  const rows = useMemo(() => {
    const maxCommits = Math.max(1, ...cells.map((c) => c.commit_count));
    const byTech = new Map<string, { name: string; category: string; byQuarter: Map<string, number> }>();
    for (const c of cells) {
      if (!byTech.has(c.technology_id)) {
        byTech.set(c.technology_id, { name: c.technology_name, category: c.category, byQuarter: new Map() });
      }
      byTech.get(c.technology_id)!.byQuarter.set(c.quarter, c.commit_count);
    }
    return Array.from(byTech.values()).map((t) => ({
      name: t.name,
      category: t.category,
      cells: quarters.map((q) => {
        const count = t.byQuarter.get(q) ?? 0;
        return count === 0 ? 0 : Math.min(4, 1 + Math.round((count / maxCommits) * 3));
      }),
    }));
  }, [cells, quarters]);

  const maxV = Math.max(1, ...velocity.map((v) => v.new_technologies));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">evolution timeline</div>
          <h1 className="text-[28px] font-semibold mt-0.5">How your skills grew over time</h1>
          <p className="text-[14px] text-ink-muted mt-1">Every cell is a quarter of commits, colored by category.</p>
        </div>
      </div>

      {velocity.length > 0 && (
        <div className="mt-6 border border-line rounded-md bg-surface p-5">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">learning velocity · technologies adopted per quarter</div>
          <svg viewBox="0 0 600 120" className="w-full h-28">
            <polyline
              fill="none"
              stroke="var(--signal)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              points={velocity.map((v, i) => `${(i / Math.max(velocity.length - 1, 1)) * 600},${110 - (v.new_technologies / maxV) * 100}`).join(" ")}
            />
            {velocity.map((v, i) => (
              <circle key={v.quarter} cx={(i / Math.max(velocity.length - 1, 1)) * 600} cy={110 - (v.new_technologies / maxV) * 100} r="2" fill="var(--signal)" />
            ))}
          </svg>
          <div className="grid font-mono text-[10px] text-ink-muted mt-1" style={{ gridTemplateColumns: `repeat(${velocity.length}, minmax(0, 1fr))` }}>
            {velocity.map((v) => <div key={v.quarter} className="text-center">{v.quarter}</div>)}
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="mt-8 border border-line rounded-md bg-surface p-5 overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid" style={{ gridTemplateColumns: `160px repeat(${quarters.length}, minmax(38px, 1fr))` }}>
              <div />
              {quarters.map((q) => (
                <div key={q} className="font-mono text-[10px] text-ink-muted text-center">{q}</div>
              ))}
              {rows.map((row) => (
                <>
                  <div key={row.name} className="font-mono text-[11.5px] py-1.5 flex items-center gap-2 pr-3">
                    <span className="w-2 h-2 rounded-sm" style={{ background: colorForCategory(row.category) }} />
                    <span className="truncate">{row.name}</span>
                  </div>
                  {row.cells.map((c, i) => (
                    <div
                      key={`${row.name}-${i}`}
                      title={`${row.name} · ${quarters[i]} · intensity ${c}/4`}
                      className="h-6 mx-0.5 my-0.5 rounded-sm"
                      style={{
                        background: c === 0 ? "var(--secondary)" : `color-mix(in oklab, ${colorForCategory(row.category)} ${25 + c * 18}%, transparent)`,
                      }}
                    />
                  ))}
                </>
              ))}
            </div>
            {milestones.length > 0 && (
              <div className="mt-3 font-mono text-[10.5px] text-ink-muted flex flex-wrap gap-4">
                {milestones.map((m) => (
                  <span key={`${m.technology_id}-${m.date}`}>◆ {m.date.slice(0, 10)} — {m.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-[13.5px] text-ink-muted">No timeline data yet — sync your profile to build history.</p>
      )}
    </div>
  );
}
