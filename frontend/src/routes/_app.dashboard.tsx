import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { ScoreCard } from "@/components/brand/ScoreCard";
import { RoleFitCard } from "@/components/brand/RoleFitCard";
import { useProfile, useProjects, useRolePredictions, useSkills, useTriggerSync } from "@/lib/queries";
import { colorForCategory } from "@/lib/category-colors";
import { SyncLog, type SyncLine } from "@/components/brand/SyncLog";
import { toast } from "sonner";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";
import { sseUrl } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { SyncProgressEvent } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function PageTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div>
      {eyebrow && <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{eyebrow}</div>}
      <h1 className="text-[28px] leading-9 font-semibold mt-0.5">{title}</h1>
      {sub && <p className="text-[14px] text-ink-muted mt-1">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: roles } = useRolePredictions();
  const { data: skills } = useSkills();
  const { data: projects } = useProjects();
  const triggerSync = useTriggerSync();

  const [state, setState] = useState<"idle" | "syncing" | "done">("idle");
  const [lines, setLines] = useState<SyncLine[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const autoSyncedRef = useRef(false);

  useEffect(() => () => eventSourceRef.current?.close(), []);

  const startSync = async () => {
    setState("syncing");
    setLines([{ text: "$ parseSkill sync", tone: "info" }]);
    try {
      const { job_id } = await triggerSync.mutateAsync();
      const es = new EventSource(sseUrl(`/sync/stream/${job_id}`), { withCredentials: true });
      eventSourceRef.current = es;
      es.addEventListener("progress", (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as SyncProgressEvent;
        setLines((prev) => [...prev, { text: `→ ${payload.stage}`, tone: payload.stage === "error" ? "warn" : undefined }]);
        if (payload.stage === "done") {
          setState("done");
          toast.success("Sync complete");
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["skills"] });
          qc.invalidateQueries({ queryKey: ["projects"] });
          qc.invalidateQueries({ queryKey: ["recommendations"] });
          es.close();
          setTimeout(() => setState("idle"), 2500);
        } else if (payload.stage === "error") {
          toast.error("Sync failed");
          es.close();
          setState("idle");
        }
      });
      es.onerror = () => {
        es.close();
        setState((s) => (s === "syncing" ? "idle" : s));
      };
    } catch {
      toast.error("Could not start sync");
      setState("idle");
    }
  };

  useEffect(() => {
    if (autoSyncedRef.current) return;
    if (!profile || profile.last_synced_at) return;
    autoSyncedRef.current = true;
    startSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const topRoles = roles?.slice(0, 3) ?? [];
  const recentProjects = projects?.slice(0, 5) ?? [];
  const topSkills = skills?.slice(0, 20) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      {/* Hero card */}
      <div className="border border-line bg-surface rounded-md p-6 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="flex items-center gap-4 min-w-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-14 h-14 rounded-full border border-line bg-secondary" alt="" />
          ) : (
            <div className="w-14 h-14 rounded-full border border-line bg-secondary" />
          )}
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">welcome back</div>
            <h1 className="text-[24px] font-semibold truncate">{profile?.display_name ?? profile?.github_handle ?? "…"}</h1>
            <p className="text-[13.5px] text-ink-muted truncate">{profile?.tagline ?? "No tagline yet — add one in settings."}</p>
            <div className="font-mono text-[11px] text-ink-muted mt-1">
              last synced · {profile?.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : "never"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">developer score</div>
            <div className="font-display font-bold text-5xl leading-none mt-1 tabular-nums">
              {profile?.coding_score != null ? Math.round(profile.coding_score) : "—"}
            </div>
          </div>
          <button
            onClick={startSync}
            disabled={state !== "idle"}
            className="h-10 px-4 rounded bg-ink text-background font-mono text-[12.5px] disabled:opacity-70 hover:bg-signal transition-colors inline-flex items-center gap-2"
          >
            {state === "idle" && <><RefreshCw className="h-4 w-4" /> update profile</>}
            {state === "syncing" && <><RefreshCw className="h-4 w-4 animate-spin" /> syncing…</>}
            {state === "done" && <><CheckCircle2 className="h-4 w-4" /> synced</>}
          </button>
        </div>
      </div>

      {state === "syncing" && (
        <div className="mt-4">
          <SyncLog className="h-48" lines={lines} done />
        </div>
      )}

      {/* Score grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <ScoreCard label="Coding" value={profile?.coding_score != null ? Math.round(profile.coding_score) : 0} trend={0} />
        <ScoreCard label="Project Quality" value={profile?.project_quality_score != null ? Math.round(profile.project_quality_score) : 0} trend={0} />
        <ScoreCard label="Consistency" value={profile?.consistency_score != null ? Math.round(profile.consistency_score) : 0} trend={0} />
        <ScoreCard label="Learning Velocity" value={profile?.learning_velocity != null ? Math.round(profile.learning_velocity) : 0} trend={0} />
      </div>

      {/* Career fit strip */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <PageTitle eyebrow="career fit" title="Top predicted roles" />
          <Link to="/recommendations" className="font-mono text-[12px] text-signal hover:underline">see full recommendations →</Link>
        </div>
        {topRoles.length > 0 ? (
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {topRoles.map((r) => <RoleFitCard key={r.role_id} role={r} />)}
          </div>
        ) : (
          <p className="mt-4 text-[13.5px] text-ink-muted">No role predictions yet — sync your profile to generate them.</p>
        )}
      </section>

      <div className="mt-10 grid lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Recent activity */}
        <section>
          <PageTitle eyebrow="recent activity" title="What's changed since last sync" />
          <div className="mt-4 border border-line rounded-md bg-surface divide-y divide-line">
            {recentProjects.length > 0 ? recentProjects.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-[13px]">{p.repo_full_name}</div>
                  <div className="text-[12.5px] text-ink-muted truncate">{p.description}</div>
                </div>
                <div className="font-mono text-[11px] text-ink-muted whitespace-nowrap">
                  {p.last_commit_at ? new Date(p.last_commit_at).toLocaleDateString() : ""}
                </div>
              </div>
            )) : (
              <div className="p-4 text-[13px] text-ink-muted">No projects analyzed yet.</div>
            )}
          </div>
        </section>

        {/* Skill graph preview */}
        <section>
          <div className="flex items-baseline justify-between">
            <PageTitle eyebrow="skill graph" title="Top skills" />
            <Link to="/graph" className="font-mono text-[12px] text-signal hover:underline">explore full graph →</Link>
          </div>
          <div className="mt-4 border border-line rounded-md bg-surface p-4">
            <svg viewBox="0 0 300 260" className="w-full h-64">
              {topSkills.map((s, i) => {
                const angle = (i / Math.max(topSkills.length, 1)) * Math.PI * 2;
                const r = 40 + s.confidence * 70;
                const cx = 150 + Math.cos(angle) * r;
                const cy = 130 + Math.sin(angle) * r;
                const size = 4 + s.confidence * 6;
                return (
                  <g key={s.id}>
                    <line x1={150} y1={130} x2={cx} y2={cy} stroke="var(--line)" strokeWidth="0.6" />
                    <circle cx={cx} cy={cy} r={size} fill={colorForCategory(s.category)} opacity={0.85} />
                  </g>
                );
              })}
              <circle cx={150} cy={130} r={7} fill="var(--ink)" />
            </svg>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              {topSkills.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: colorForCategory(s.category) }} />
                    {s.name}
                  </span>
                  <span className="w-20 shrink-0"><ConfidenceBar value={s.confidence} showLabel={false} /></span>
                </div>
              ))}
              {topSkills.length === 0 && <div className="text-ink-muted col-span-2">No skills detected yet.</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
