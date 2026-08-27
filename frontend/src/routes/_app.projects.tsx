import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProject, useProjects } from "@/lib/queries";
import { Receipt } from "@/components/brand/Receipt";
import { Star, TestTube2, GitFork, X } from "lucide-react";

export const Route = createFileRoute("/_app/projects")({ component: ProjectsPage });

function ProjectsPage() {
  const { data: projects } = useProjects();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"complexity" | "recent" | "stars">("complexity");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: openProject } = useProject(openId);

  const list = useMemo(() => projects ?? [], [projects]);

  const filtered = useMemo(() => {
    let l = list.filter((p) => p.repo_full_name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "complexity") l = [...l].sort((a, b) => (b.complexity_score ?? 0) - (a.complexity_score ?? 0));
    if (sort === "stars") l = [...l].sort((a, b) => b.stars - a.stars);
    if (sort === "recent") {
      l = [...l].sort((a, b) => new Date(b.last_commit_at ?? 0).getTime() - new Date(a.last_commit_at ?? 0).getTime());
    }
    return l;
  }, [list, q, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">projects</div>
        <h1 className="text-[28px] font-semibold mt-0.5">Analyzed repositories</h1>
        <p className="text-[14px] text-ink-muted mt-1">{list.length} non-fork repositories, ranked by evidence weight.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border border-line rounded-md p-2 bg-surface">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="search projects…"
          className="h-9 rounded border border-line bg-background px-3 font-mono text-[12px] w-56 focus:border-signal outline-none"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="h-9 rounded border border-line bg-background px-2 font-mono text-[12px]">
          <option value="complexity">sort: complexity</option>
          <option value="recent">sort: recent</option>
          <option value="stars">sort: stars</option>
        </select>
        <div className="ml-auto font-mono text-[11px] text-ink-muted">{filtered.length} results</div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpenId(p.id)}
            className="text-left bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-mono text-[13px] font-semibold truncate">{p.repo_full_name}</div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted shrink-0">
                <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3" /> {p.stars}</span>
                {p.is_fork && <GitFork className="h-3 w-3" />}
              </div>
            </div>
            <p className="text-[12.5px] text-ink-muted mt-1 line-clamp-2">{p.description}</p>
            <div className="mt-3">
              <div className="flex items-center justify-between font-mono text-[10.5px] text-ink-muted mb-1">
                <span>complexity</span><span>{Math.round(p.complexity_score ?? 0)}/100</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-signal" style={{ width: `${p.complexity_score ?? 0}%` }} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.top_technologies.slice(0, 4).map((t) => (
                <span key={t} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60">{t}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-ink-muted">
              <span>ownership {p.contribution_weight != null ? Math.round(p.contribution_weight * 100) : "—"}%</span>
              <span>{p.last_commit_at ? new Date(p.last_commit_at).toLocaleDateString() : ""}</span>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="col-span-full text-center text-[13.5px] text-ink-muted py-12">
            No projects analyzed yet — sync your profile from the dashboard.
          </div>
        )}
      </div>

      {openId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-auto" onClick={() => setOpenId(null)}>
          <div className="w-full max-w-3xl bg-surface border border-line rounded-md mt-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">project</div>
                <h2 className="text-lg font-semibold">{openProject?.repo_full_name ?? "…"}</h2>
              </div>
              <button onClick={() => setOpenId(null)} className="p-1"><X className="h-4 w-4" /></button>
            </div>
            {openProject && (
              <div className="p-4 grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[14px]">{openProject.description}</p>
                  <div className="mt-4">
                    <div className="font-mono text-[11px] uppercase text-ink-muted">detected technologies</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {openProject.technologies.map((t) => (
                        <span key={t.name} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60">{t.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-[11px] uppercase text-ink-muted">architecture patterns</div>
                    <ul className="mt-1 font-mono text-[12.5px] list-disc pl-4 space-y-0.5">
                      {openProject.architecture_patterns.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                  {openProject.readme_excerpt && (
                    <div className="mt-4">
                      <div className="font-mono text-[11px] uppercase text-ink-muted">readme excerpt</div>
                      <p className="mt-1 text-[13px] text-ink-muted leading-6">{openProject.readme_excerpt}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Receipt
                    title={`${openProject.repo_full_name} · complexity ${Math.round(openProject.complexity_score ?? 0)}`}
                    items={[
                      { label: "patterns", value: `${openProject.architecture_patterns.length} detected` },
                      { label: "concepts", value: `${openProject.concepts_demonstrated.length} demonstrated` },
                      { label: "ownership", value: `${openProject.contribution_weight != null ? Math.round(openProject.contribution_weight * 100) : "—"}%` },
                      { label: "language", value: openProject.primary_language ?? "—" },
                      { label: "stars", value: `${openProject.stars}` },
                      { label: "forks", value: `${openProject.forks}` },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
