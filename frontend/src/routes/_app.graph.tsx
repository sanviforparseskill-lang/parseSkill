import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGraphSkills, useSkillEvidence } from "@/lib/queries";
import { colorForCategory, normalizeCategory, type Category } from "@/lib/category-colors";
import { Receipt } from "@/components/brand/Receipt";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/graph")({ component: GraphPage });

const cats: Category[] = ["Backend", "Frontend", "ML/AI", "DevOps", "Database", "Language/Core"];

type ViewMode = "skill" | "project" | "technology";
const views: { mode: ViewMode; label: string }[] = [
  { mode: "skill", label: "Skill" },
  { mode: "project", label: "Project" },
  { mode: "technology", label: "Technology" },
];
const nounForView: Record<ViewMode, string> = { skill: "skills", project: "projects", technology: "technologies" };

function GraphPage() {
  const { data: graph } = useGraphSkills();
  const [view, setView] = useState<ViewMode>("skill");
  const [minConf, setMinConf] = useState(0);
  const [activeCats, setActiveCats] = useState<Category[]>(cats);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const viewNodes = useMemo(
    () => (graph?.nodes ?? []).filter((n) => n.data.type === view),
    [graph, view],
  );

  // Projects carry no category/confidence of their own, so those filters
  // only make sense for skill/technology views.
  const hasCategories = view !== "project";
  const hasConfidence = view === "skill";

  const visible = useMemo(
    () =>
      viewNodes.filter((n) => {
        const conf = n.data.confidence ?? 0.6;
        if (hasConfidence && conf < minConf) return false;
        if (hasCategories && !activeCats.includes(normalizeCategory((n.data as { category?: string }).category))) return false;
        return true;
      }),
    [viewNodes, minConf, activeCats, hasCategories, hasConfidence],
  );

  const nodes = useMemo(() => {
    // Group by category first so nodes spread evenly within their category's
    // wedge instead of bunching by confidence alone (many skills land in the
    // same category with near-identical confidence, e.g. an all-frontend
    // stack, which used to stack them on top of each other on one ring).
    const byCategory = new Map<Category, typeof visible>();
    for (const n of visible) {
      const cat = normalizeCategory((n.data as { category?: string }).category);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(n);
    }

    const wedge = ((Math.PI * 2) / cats.length) * 0.82; // leave a gap between category wedges
    const placed = visible.map((n) => {
      const cat = normalizeCategory((n.data as { category?: string }).category);
      const conf = n.data.confidence ?? 0.6;
      const siblings = byCategory.get(cat)!;
      const idxInCat = siblings.indexOf(n);
      const catAngle = (cats.indexOf(cat) / cats.length) * Math.PI * 2;
      const spread = siblings.length > 1 ? (idxInCat / (siblings.length - 1) - 0.5) * wedge : 0;
      const band = idxInCat % 3; // stagger into concentric bands so same-confidence nodes don't ring up
      const r = 85 + (1 - conf) * 110 + band * 45;
      return {
        id: n.data.id,
        name: n.data.label,
        category: cat,
        confidence: conf,
        x: 400 + Math.cos(catAngle + spread) * r,
        y: 300 + Math.sin(catAngle + spread) * r,
        radius: 6 + conf * 14,
      };
    });

    // Relax overlaps: push apart any pair closer than their combined radius
    // plus room for their labels, so circles and text stay legible.
    for (let iter = 0; iter < 200; iter++) {
      let moved = false;
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i];
          const b = placed[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const minDist = a.radius + b.radius + 34;
          if (dist < minDist) {
            moved = true;
            const push = (minDist - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
      if (!moved) break;
    }
    for (const p of placed) {
      p.x = Math.min(760, Math.max(40, p.x));
      p.y = Math.min(560, Math.max(40, p.y));
    }

    return placed;
  }, [visible]);

  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0] ?? null;
  const rawSkillId = selected?.id.startsWith("skill:") ? selected.id.slice("skill:".length) : null;
  const { data: evidence } = useSkillEvidence(rawSkillId);

  const nodeLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of graph?.nodes ?? []) m.set(n.data.id, n.data.label);
    return m;
  }, [graph]);

  const relatedNodes = useMemo(() => {
    if (!selected || view === "skill") return [];
    return (graph?.edges ?? [])
      .filter((e) => e.data.source === selected.id || e.data.target === selected.id)
      .map((e) => {
        const otherId = e.data.source === selected.id ? e.data.target : e.data.source;
        return { id: otherId, label: nodeLabelById.get(otherId) ?? otherId, weight: e.data.weight };
      })
      .sort((a, b) => b.weight - a.weight);
  }, [graph, selected, view, nodeLabelById]);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    setSelectedId(null);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Toolbar */}
      <div className="h-12 border-b border-line px-4 flex items-center gap-4 bg-surface">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">skill graph</div>
        <div className="flex items-center gap-1 border border-line rounded font-mono text-[11px]">
          {views.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 ${view === mode ? "bg-signal text-signal-foreground" : "text-ink-muted hover:text-ink"}`}
            >
              {label}-centric
            </button>
          ))}
        </div>
        <button className="h-8 px-2 border border-line rounded font-mono text-[11px] hover:border-signal inline-flex items-center gap-1 ml-auto">
          <Download className="h-3.5 w-3.5" /> export
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[220px_1fr_320px]">
        {/* Left filters */}
        <aside className="border-r border-line p-4 space-y-5 overflow-auto bg-surface">
          {hasCategories && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">category</div>
              <div className="space-y-1">
                {cats.map((c) => (
                  <label key={c} className="flex items-center gap-2 font-mono text-[12px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeCats.includes(c)}
                      onChange={() =>
                        setActiveCats((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
                      }
                      className="accent-signal"
                    />
                    <span className="w-2 h-2 rounded-sm" style={{ background: colorForCategory(c) }} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {hasConfidence && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
                min confidence · {Math.round(minConf * 100)}%
              </div>
              <input
                type="range" min={0} max={100} value={minConf * 100}
                onChange={(e) => setMinConf(Number(e.target.value) / 100)}
                className="w-full accent-signal"
              />
            </div>
          )}
          <div className="font-mono text-[11px] text-ink-muted border-t border-line pt-3">
            showing {visible.length} of {viewNodes.length} {nounForView[view]}
          </div>
        </aside>

        {/* Graph */}
        <div className="relative overflow-hidden bg-background">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            {nodes.map((n) =>
              nodes
                .filter((m) => m.id !== n.id && m.category === n.category)
                .slice(0, 2)
                .map((m) => (
                  <line key={`${n.id}-${m.id}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                    stroke="var(--line)" strokeWidth="0.7" />
                )),
            )}
            {nodes.map((n) => (
              <g key={n.id} onClick={() => setSelectedId(n.id)} className="cursor-pointer">
                <circle
                  cx={n.x} cy={n.y} r={n.radius}
                  fill={colorForCategory(n.category)}
                  opacity={selectedId === n.id ? 1 : 0.85}
                  stroke={selectedId === n.id ? "var(--proof)" : "transparent"}
                  strokeWidth="2"
                />
                <text x={n.x} y={n.y + n.radius + 12}
                  textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10"
                  fill="var(--ink)">{n.name}</text>
              </g>
            ))}
          </svg>
          {nodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-ink-muted">
              No {nounForView[view]} to graph yet — sync your profile first.
            </div>
          )}
        </div>

        {/* Right detail */}
        <aside className="border-l border-line p-4 overflow-auto bg-surface">
          {selected ? (
            <>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">selected node</div>
              <h2 className="mt-1 text-lg font-semibold">{selected.name}</h2>
              {view === "skill" ? (
                <>
                  <div className="mt-1 font-mono text-[11px] text-ink-muted">{selected.category}</div>
                  <div className="mt-3"><ConfidenceBar value={selected.confidence} size="md" /></div>
                  <div className="mt-4">
                    <Receipt
                      key={selected.id}
                      title={`${selected.name} · confidence ${selected.confidence.toFixed(2)}`}
                      items={[
                        { label: "breadth", value: evidence ? evidence.breadth.toFixed(2) : "…" },
                        { label: "depth", value: evidence ? evidence.depth.toFixed(2) : "…" },
                        { label: "recency", value: evidence ? evidence.recency.toFixed(2) : "…" },
                        { label: "category", value: selected.category },
                      ]}
                    />
                    {evidence && evidence.evidence_repos.length > 0 && (
                      <div className="mt-4">
                        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">evidence repos</div>
                        <ul className="space-y-1 font-mono text-[12px]">
                          {evidence.evidence_repos.map((e) => (
                            <li key={e.project_id} className="border border-line rounded p-2">
                              <div className="text-ink">{e.repo_full_name}</div>
                              <div className="text-ink-muted">{e.technologies.join(", ")}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
                    {view === "technology" ? "used by / maps to" : "technologies used"}
                  </div>
                  {relatedNodes.length > 0 ? (
                    <ul className="space-y-1 font-mono text-[12px]">
                      {relatedNodes.map((r) => (
                        <li key={r.id} className="border border-line rounded p-2 flex items-center justify-between">
                          <span className="text-ink">{r.label}</span>
                          <span className="text-ink-muted">{r.weight.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="font-mono text-[12px] text-ink-muted">No connections found.</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="font-mono text-[12px] text-ink-muted">Select a node to see its evidence.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
